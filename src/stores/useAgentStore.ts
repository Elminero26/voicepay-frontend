import { create } from 'zustand';
import type { Call } from '../types';

export type AgentStatus = 'available' | 'busy' | 'offline';
export type CallState = 'idle' | 'ringing' | 'calling' | 'active';

interface AgentStoreState {
  agentStatus: AgentStatus;
  softphoneOpen: boolean;
  screenPopOpen: boolean;
  callState: CallState;
  activeCall: Call | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  dialNumber: string;
  callDuration: number; // in seconds
  transcriptionHistory: { role: 'bot' | 'user' | 'agent'; text: string; timestamp: string }[];

  // Actions
  setAgentStatus: (status: AgentStatus) => void;
  setSoftphoneOpen: (open: boolean) => void;
  setScreenPopOpen: (open: boolean) => void;
  dialDigit: (digit: string) => void;
  clearDial: () => void;
  setDialNumber: (number: string) => void;
  startCall: (number: string) => void;
  receiveIncomingCall: (call: Call) => void;
  acceptCall: () => void;
  declineCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  incrementDuration: () => void;
  addTranscription: (role: 'bot' | 'user' | 'agent', text: string) => void;
  clearTranscriptionHistory: () => void;
  transferToIvr: () => Promise<void>;
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  agentStatus: 'available',
  softphoneOpen: false,
  screenPopOpen: false,
  callState: 'idle',
  activeCall: null,
  isMuted: false,
  isSpeakerOn: true,
  dialNumber: '',
  callDuration: 0,
  transcriptionHistory: [],

  setAgentStatus: (status) => {
    set({ agentStatus: status });
    // If agent goes offline/busy, and is ringing or calling, we cancel/hang up
    if (status !== 'available') {
      const { callState } = get();
      if (callState === 'ringing') {
        get().declineCall();
      }
    }
  },

  setSoftphoneOpen: (open) => set({ softphoneOpen: open }),

  setScreenPopOpen: (open) => set({ screenPopOpen: open }),

  dialDigit: (digit) => set((state) => ({ dialNumber: state.dialNumber + digit })),

  clearDial: () => set({ dialNumber: '' }),

  setDialNumber: (dialNumber) => set({ dialNumber }),

  startCall: (number) => {
    if (!number.trim()) return;
    
    // Check if offline/busy
    const { agentStatus } = get();
    if (agentStatus === 'offline') {
      return;
    }

    const mockCall: Call = {
      id: `agent-out-${Date.now()}`,
      customerName: 'Outgoing Call',
      phoneNumber: number,
      status: 'in-progress',
      amount: 0,
      timestamp: new Date().toLocaleTimeString(),
      direction: 'outbound'
    };

    set({
      callState: 'calling',
      activeCall: mockCall,
      callDuration: 0,
      transcriptionHistory: [
        { role: 'agent', text: `Dialing ${number}...`, timestamp: new Date().toLocaleTimeString() }
      ]
    });

    // Simulate connection after 2 seconds
    setTimeout(() => {
      const state = get();
      if (state.callState === 'calling' && state.activeCall?.id === mockCall.id) {
        set({
          callState: 'active',
          transcriptionHistory: [
            ...state.transcriptionHistory,
            { role: 'bot', text: 'Call connected securely. WebRTC channel initialized.', timestamp: new Date().toLocaleTimeString() }
          ]
        });
      }
    }, 2000);
  },

  receiveIncomingCall: (call) => {
    const { agentStatus, callState } = get();
    // Only receive calls if available and not already in a call
    if (agentStatus === 'available' && callState === 'idle') {
      set({
        callState: 'ringing',
        activeCall: call,
        softphoneOpen: true, // Auto open softphone when ringing
        screenPopOpen: true, // Auto open screen pop when ringing
        callDuration: 0,
        transcriptionHistory: [
          { role: 'bot', text: 'Incoming connection established.', timestamp: new Date().toLocaleTimeString() }
        ]
      });
    }
  },

  acceptCall: () => {
    const { callState, activeCall } = get();
    if (callState === 'ringing' && activeCall) {
      set({
        callState: 'active',
        transcriptionHistory: [
          ...get().transcriptionHistory,
          { role: 'bot', text: 'Call connected. Voice channel active.', timestamp: new Date().toLocaleTimeString() }
        ]
      });
    }
  },

  declineCall: () => {
    set({
      callState: 'idle',
      activeCall: null,
      screenPopOpen: false,
      callDuration: 0,
      transcriptionHistory: []
    });
  },

  hangUp: () => {
    const { activeCall } = get();
    if (activeCall) {
      set({
        callState: 'idle',
        activeCall: null,
        screenPopOpen: false,
        callDuration: 0,
        transcriptionHistory: []
      });
    }
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleSpeaker: () => set((state) => ({ isSpeakerOn: !state.isSpeakerOn })),

  incrementDuration: () => {
    const { callState } = get();
    if (callState === 'active') {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }
  },

  addTranscription: (role, text) => set((state) => ({
    transcriptionHistory: [
      ...state.transcriptionHistory,
      { role, text, timestamp: new Date().toLocaleTimeString() }
    ]
  })),

  clearTranscriptionHistory: () => set({ transcriptionHistory: [] }),

  transferToIvr: async () => {
    const { activeCall } = get();
    if (!activeCall) return;

    try {
      if (activeCall.id !== 'sim-call-999') {
        const { ivrService } = await import('../services/api');
        await ivrService.transferToPaymentIvr(activeCall.id);
      }

      set({
        callState: 'idle',
        activeCall: null,
        screenPopOpen: false,
        callDuration: 0,
        transcriptionHistory: []
      });

      if (activeCall.id === 'sim-call-999') {
        const { useCallStore } = await import('./useCallStore');
        const callStore = useCallStore.getState();
        
        // Change simulation path to payment so it proceeds to complete the payment
        callStore.startSimulation('payment');
        callStore.setSimStep(5);
        
        setTimeout(() => {
          callStore.setSimStep(6);
        }, 1500);
      }
    } catch (error) {
      console.error('Error transferring call back to IVR:', error);
    }
  }
}));
