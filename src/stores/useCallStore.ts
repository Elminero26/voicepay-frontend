import { create } from 'zustand';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Call } from '../types';
import { ivrService } from '../services/api';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
}

export type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'failed';

interface CallStoreState {
  // WebSocket & Live Calls
  liveCalls: Call[];
  connected: boolean;
  selectedCallId: string | null;
  cachedCall: Call | null;
  notifications: SystemNotification[];
  client: Client | null;
  transcriptions: Record<string, string>;

  // Reconnection and status state
  connectionState: ConnectionState;
  reconnectAttempts: number;
  secondsRemaining: number;
  reconnectTimeoutId: any;
  reconnectIntervalId: any;
  toastFn: ((title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void) | null;

  // Simulator State
  isSimulating: boolean;
  simStep: number;
  simPath: 'payment' | 'agent';
  simulatedCall: Call | null;

  // Setters & Actions
  setLiveCalls: (calls: Call[]) => void;
  setConnected: (connected: boolean) => void;
  setSelectedCallId: (id: string | null) => void;
  setCachedCall: (call: Call | null) => void;
  setCallTranscription: (callId: string, text: string) => void;
  addNotification: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // WebSocket connection actions
  connectWebSocket: (toastFn?: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void) => void;
  disconnectWebSocket: () => void;
  triggerBackoff: () => void;
  reconnectManual: () => void;

  // Simulation Actions
  startSimulation: (path: 'payment' | 'agent') => void;
  stopSimulation: () => void;
  setSimStep: (step: number | ((prev: number) => number)) => void;
  setSimulatedCall: (call: Call | null) => void;
  resetToPending: () => void;
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  // Initial State
  liveCalls: [],
  connected: false,
  selectedCallId: null,
  cachedCall: (() => {
    try {
      const saved = localStorage.getItem('voicepay_last_active_call');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })(),
  notifications: [],
  client: null,
  transcriptions: {},

  // Reconnection state
  connectionState: 'disconnected',
  reconnectAttempts: 0,
  secondsRemaining: 0,
  reconnectTimeoutId: null,
  reconnectIntervalId: null,
  toastFn: null,

  isSimulating: false,
  simStep: 0,
  simPath: 'payment',
  simulatedCall: null,

  // Simple setters
  setLiveCalls: (liveCalls) => set({ liveCalls }),
  setConnected: (connected) => set({ connected }),
  setSelectedCallId: (selectedCallId) => set({ selectedCallId }),
  setCachedCall: (cachedCall) => {
    if (cachedCall) {
      localStorage.setItem('voicepay_last_active_call', JSON.stringify(cachedCall));
    } else {
      localStorage.removeItem('voicepay_last_active_call');
    }
    set({ cachedCall });
  },
  setCallTranscription: (callId, text) => set((state) => ({
    transcriptions: {
      ...state.transcriptions,
      [callId]: text
    }
  })),

  addNotification: (title, message, type = 'info') => {
    const newNotification: SystemNotification = {
      id: Math.random().toString(36).substring(7),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markNotificationAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  // WebSocket logic
  connectWebSocket: (toastFn) => {
    const state = get();
    if (toastFn) {
      set({ toastFn });
    }

    // Only allow connection if not already connected or connecting
    if (state.connected || state.connectionState === 'connected' || state.connectionState === 'connecting') {
      return;
    }

    set({ connectionState: 'connecting' });

    // 1. Fetch initial calls via HTTP
    ivrService.getLiveCalls()
      .then((initialCalls) => {
        set({ liveCalls: initialCalls });
        
        // If there's no selected call yet, pick the first one
        if (initialCalls.length > 0 && !get().selectedCallId) {
          set({ selectedCallId: initialCalls[0].id });
        }
      })
      .catch((err) => {
        console.error('[CallStore] Error fetching initial live calls:', err);
      });

    // Clean up any existing client if present
    const { client: existingClient } = get();
    if (existingClient) {
      try {
        existingClient.deactivate();
      } catch (e) {
        console.error('[CallStore] Error deactivating old client:', e);
      }
    }

    // 2. Setup STOMP WebSocket client
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 0, // Disable built-in reconnect. We manage it via exponential backoff.

      onConnect: () => {
        console.log('[WebSocket Store] ✅ Conectado al ivr-service');
        set({ 
          connected: true, 
          connectionState: 'connected',
          reconnectAttempts: 0,
          secondsRemaining: 0
        });

        // Clear any active reconnect timeouts/intervals
        const { reconnectTimeoutId, reconnectIntervalId } = get();
        if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
        if (reconnectIntervalId) clearInterval(reconnectIntervalId);
        set({ reconnectTimeoutId: null, reconnectIntervalId: null });

        stompClient.subscribe('/topic/live-calls', (message) => {
          try {
            const rawCalls = JSON.parse(message.body);
            const currentLiveCalls = get().liveCalls;
            const currentToast = get().toastFn;

            // Transform backend format to frontend format
            const mapped: Call[] = rawCalls.map((c: any) => ({
              id: String(c.id),
              customerName: c.userName || 'Unknown Caller',
              phoneNumber: c.phoneNumber || '-',
              status: c.status === 'COMPLETED' ? 'completed'
                    : c.status === 'FAILED'    ? 'failed'
                    : c.status === 'TRANSFERRED' ? 'completed'
                    : 'in-progress',
              amount: Number(c.callAmount) || 0,
              duration: c.timestamp
                ? `${Math.floor((Date.now() - new Date(c.timestamp).getTime()) / 60000)}m ${Math.floor(((Date.now() - new Date(c.timestamp).getTime()) % 60000) / 1000)}s`
                : '-',
              timestamp: c.timestamp
                ? new Date(c.timestamp).toLocaleTimeString()
                : '-',
              callEvents: c.callEvents || [],
              selectedOption: c.selectedOption || null,
            }));

            // 🔔 Notification Logic & toast synchronization
            mapped.forEach((newCall) => {
              const oldCall = currentLiveCalls.find((c) => c.id === newCall.id);
              
              if (oldCall && oldCall.status === 'in-progress' && newCall.status !== 'in-progress') {
                if (newCall.status === 'completed') {
                  const title = 'Payment Completed';
                  const msg = `Payment from ${newCall.customerName} was successful.`;
                  if (currentToast) currentToast(title, msg, 'success');
                  get().addNotification(title, msg, 'success');
                } else if (newCall.status === 'failed') {
                  const title = 'Payment Failed';
                  const msg = `Payment from ${newCall.customerName} failed.`;
                  if (currentToast) currentToast(title, msg, 'error');
                  get().addNotification(title, msg, 'error');
                }
              }
            });

            // Detect new incoming call
            if (mapped.length > currentLiveCalls.length) {
              const newCall = mapped[mapped.length - 1];
              const title = 'Incoming Call';
              const msg = `New call from ${newCall.customerName || 'Unknown Caller'} (${newCall.phoneNumber})`;
              if (currentToast) currentToast(title, msg, 'info');
              get().addNotification(title, msg, 'info');
            }

            set({ liveCalls: mapped });
          } catch (err) {
            console.error('[WebSocket Store] Error parsing live calls:', err);
          }
        });

        stompClient.subscribe('/topic/transcriptions', (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data && data.callSid && data.role === 'user') {
              get().setCallTranscription(data.callSid, data.text);
            }
          } catch (err) {
            console.error('[WebSocket Store] Error parsing transcription:', err);
          }
        });
      },

      onDisconnect: () => {
        console.log('[WebSocket Store] ❌ Desconectado del ivr-service');
        set({ connected: false, connectionState: 'disconnected' });
      },

      onStompError: (frame) => {
        console.error('[WebSocket Store] Error STOMP:', frame.headers['message']);
        set({ connectionState: 'failed' });
        get().triggerBackoff();
      },

      onWebSocketClose: () => {
        console.log('[WebSocket Store] ⚠️ WebSocket cerrado');
        set({ connected: false });
        
        // If we were supposed to be active, trigger exponential backoff
        const { connectionState } = get();
        if (connectionState === 'connected' || connectionState === 'connecting') {
          get().triggerBackoff();
        }
      },

      onWebSocketError: (error) => {
        console.error('[WebSocket Store] ⚠️ WebSocket error:', error);
        
        const { connectionState } = get();
        if (connectionState === 'connected' || connectionState === 'connecting') {
          get().triggerBackoff();
        }
      }
    });

    stompClient.activate();
    set({ client: stompClient });
  },

  disconnectWebSocket: () => {
    const { client, reconnectTimeoutId, reconnectIntervalId } = get();
    
    if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
    if (reconnectIntervalId) clearInterval(reconnectIntervalId);

    set({ 
      client: null, 
      connected: false,
      connectionState: 'disconnected',
      reconnectAttempts: 0,
      secondsRemaining: 0,
      reconnectTimeoutId: null,
      reconnectIntervalId: null
    });

    if (client) {
      try {
        client.deactivate();
      } catch (e) {
        console.error('[CallStore] Error deactivating during disconnectWebSocket:', e);
      }
    }
  },

  triggerBackoff: () => {
    const { reconnectAttempts, reconnectTimeoutId, reconnectIntervalId } = get();
    
    // Clear any existing timers first
    if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
    if (reconnectIntervalId) clearInterval(reconnectIntervalId);

    // Calculate delay: 2s, 4s, 8s, 16s, 30s max
    const delayMs = Math.min(30000, 2000 * Math.pow(2, reconnectAttempts)); 
    const delaySecs = Math.ceil(delayMs / 1000);

    set({
      connectionState: 'reconnecting',
      reconnectAttempts: reconnectAttempts + 1,
      secondsRemaining: delaySecs,
    });

    console.log(`[WebSocket Store] Reconnecting in ${delaySecs}s (Attempt ${reconnectAttempts + 1})`);

    // Setup countdown timer updating every second
    const intervalId = setInterval(() => {
      const { secondsRemaining } = get();
      if (secondsRemaining <= 1) {
        clearInterval(intervalId);
        set({ secondsRemaining: 0, reconnectIntervalId: null });
      } else {
        set({ secondsRemaining: secondsRemaining - 1 });
      }
    }, 1000);

    // Setup reconnection trigger
    const timeoutId = setTimeout(() => {
      const { reconnectIntervalId: currentInterval } = get();
      if (currentInterval) clearInterval(currentInterval);
      
      set({ 
        reconnectTimeoutId: null, 
        reconnectIntervalId: null,
        connectionState: 'connecting' 
      });
      
      // Retry connection
      get().connectWebSocket();
    }, delayMs);

    set({
      reconnectTimeoutId: timeoutId,
      reconnectIntervalId: intervalId,
    });
  },

  reconnectManual: () => {
    const { reconnectTimeoutId, reconnectIntervalId, client } = get();
    
    console.log('[WebSocket Store] 🔄 Manual reconnect requested');

    // Clear timers
    if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
    if (reconnectIntervalId) clearInterval(reconnectIntervalId);
    
    set({
      reconnectTimeoutId: null,
      reconnectIntervalId: null,
      reconnectAttempts: 0,
      secondsRemaining: 0,
      connectionState: 'connecting',
    });

    // Clean up old client
    if (client) {
      try {
        client.deactivate();
      } catch (e) {
        console.error('[CallStore] Error deactivating on manual reconnect:', e);
      }
    }
    
    // Connect immediately
    get().connectWebSocket();
  },

  // Simulator actions
  startSimulation: (path) => {
    get().stopSimulation();
    set({
      isSimulating: true,
      simPath: path,
      simStep: 1,
    });
  },

  stopSimulation: () => {
    set({
      isSimulating: false,
      simStep: 0,
      simulatedCall: null,
    });
  },

  setSimStep: (stepUpdate) => {
    if (typeof stepUpdate === 'function') {
      set((state) => {
        const nextStep = stepUpdate(state.simStep);
        return { simStep: nextStep };
      });
    } else {
      set({ simStep: stepUpdate });
    }
  },

  setSimulatedCall: (simulatedCall) => set({ simulatedCall }),

  resetToPending: () => {
    get().stopSimulation();
    localStorage.removeItem('voicepay_last_active_call');
    set({
      cachedCall: null,
      selectedCallId: null,
    });
  },
}));
