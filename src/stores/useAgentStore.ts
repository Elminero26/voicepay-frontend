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
  isSoftphoneDocked: boolean;
  isHeld: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConsulting: boolean;
  consultationState: 'idle' | 'calling' | 'connected';
  consultationNumber: string;

  // Actions
  setAgentStatus: (status: AgentStatus) => void;
  setSoftphoneOpen: (open: boolean) => void;
  setSoftphoneDocked: (docked: boolean) => void;
  setScreenPopOpen: (open: boolean) => void;
  dialDigit: (digit: string) => void;
  clearDial: () => void;
  setDialNumber: (number: string) => void;
  startCall: (number: string) => void;
  receiveIncomingCall: (call: Call) => void;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  toggleSpeaker: () => void;
  incrementDuration: () => void;
  addTranscription: (role: 'bot' | 'user' | 'agent', text: string) => void;
  clearTranscriptionHistory: () => void;
  transferToIvr: () => Promise<void>;
  initiateBlindTransfer: (targetNumber: string) => Promise<void>;
  initiateAssistedTransfer: (targetNumber: string) => Promise<void>;
  completeAssistedTransfer: () => Promise<void>;
  cancelAssistedTransfer: () => Promise<void>;
}

export const useAgentStore = create<AgentStoreState>((set, get) => {
  // Helper to stop all tracks in a MediaStream
  const stopStreamTracks = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Helper to request mic access or fallback to mock destination stream
  const acquireAudioStream = async (): Promise<MediaStream | null> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      console.warn('Microphone access denied or unsupported browser. Falling back to mock AudioContext stream.', err);
    }
    
    // Fallback: Create a mock MediaStream using Web Audio API so tracks are not null and enabled toggling works
    if (typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const dest = ctx.createMediaStreamDestination();
          // Keep context running/warm
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0.001; // Silent
          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          return dest.stream;
        }
      } catch (e) {
        console.warn('Failed to build mock AudioContext stream:', e);
      }
    }
    return null;
  };

  return {
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
    isSoftphoneDocked: true,
    isHeld: false,
    localStream: null,
    remoteStream: null,
    isConsulting: false,
    consultationState: 'idle',
    consultationNumber: '',

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

    setSoftphoneDocked: (isSoftphoneDocked) => set({ isSoftphoneDocked }),

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

      // Acquire media streams for call
      acquireAudioStream().then(stream => {
        set({ localStream: stream });
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

    acceptCall: async () => {
      const { callState, activeCall } = get();
      if (callState === 'ringing' && activeCall) {
        const stream = await acquireAudioStream();
        set({
          callState: 'active',
          localStream: stream,
          transcriptionHistory: [
            ...get().transcriptionHistory,
            { role: 'bot', text: 'Call connected. Voice channel active.', timestamp: new Date().toLocaleTimeString() }
          ]
        });
      }
    },

    declineCall: () => {
      const { localStream, remoteStream } = get();
      stopStreamTracks(localStream);
      stopStreamTracks(remoteStream);
      
      set({
        callState: 'idle',
        activeCall: null,
        screenPopOpen: false,
        callDuration: 0,
        transcriptionHistory: [],
        localStream: null,
        remoteStream: null,
        isHeld: false,
        isConsulting: false,
        consultationState: 'idle',
        consultationNumber: ''
      });
    },

    hangUp: () => {
      const { activeCall, localStream, remoteStream } = get();
      if (activeCall) {
        stopStreamTracks(localStream);
        stopStreamTracks(remoteStream);
        
        set({
          callState: 'idle',
          activeCall: null,
          screenPopOpen: false,
          callDuration: 0,
          transcriptionHistory: [],
          localStream: null,
          remoteStream: null,
          isHeld: false,
          isConsulting: false,
          consultationState: 'idle',
          consultationNumber: ''
        });
      }
    },

    toggleMute: () => {
      const nextMuted = !get().isMuted;
      set({ isMuted: nextMuted });
      
      const { localStream } = get();
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = !nextMuted;
        });
      }
    },

    toggleHold: () => {
      const nextHeld = !get().isHeld;
      set({ isHeld: nextHeld });

      const { localStream, remoteStream, isMuted } = get();
      
      // Control WebRTC media tracks depending on hold state
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          // If on hold, disable mic track. Otherwise, follow mute state.
          track.enabled = !nextHeld && !isMuted;
        });
      }
      if (remoteStream) {
        remoteStream.getAudioTracks().forEach(track => {
          // If on hold, disable remote audio play
          track.enabled = !nextHeld;
        });
      }

      get().addTranscription('bot', nextHeld ? 'Call placed on HOLD.' : 'Call RESUMED from hold.');
    },

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
      const { activeCall, localStream, remoteStream } = get();
      if (!activeCall) return;

      try {
        if (activeCall.id !== 'sim-call-999') {
          const { ivrService } = await import('../services/api');
          await ivrService.transferToPaymentIvr(activeCall.id);
        }

        stopStreamTracks(localStream);
        stopStreamTracks(remoteStream);

        set({
          callState: 'idle',
          activeCall: null,
          agentStatus: 'available', // LIBERAR A DISPONIBLE
          screenPopOpen: false,
          callDuration: 0,
          transcriptionHistory: [],
          localStream: null,
          remoteStream: null,
          isHeld: false,
          isConsulting: false,
          consultationState: 'idle',
          consultationNumber: ''
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
        try {
          const { useCallStore } = await import('./useCallStore');
          const toastFn = useCallStore.getState().toastFn;
          if (toastFn) {
            toastFn(
              'Error de Transferencia',
              'No se pudo retornar la llamada al IVR seguro (Acceso Denegado / ID no válido).',
              'error'
            );
          }
        } catch (toastErr) {
          console.error('Failed to trigger toast alert:', toastErr);
        }
      }
    },

    initiateBlindTransfer: async (targetNumber) => {
      const { activeCall, localStream, remoteStream } = get();
      if (!activeCall) return;

      get().addTranscription('agent', `Initiating blind transfer to ${targetNumber}...`);
      get().addTranscription('bot', `Caller transferred to ${targetNumber}. Handshake completed.`);

      stopStreamTracks(localStream);
      stopStreamTracks(remoteStream);

      set({
        callState: 'idle',
        activeCall: null,
        agentStatus: 'available', // LIBERAR A DISPONIBLE
        screenPopOpen: false,
        callDuration: 0,
        transcriptionHistory: [],
        localStream: null,
        remoteStream: null,
        isHeld: false,
        isConsulting: false,
        consultationState: 'idle',
        consultationNumber: ''
      });
    },

    initiateAssistedTransfer: async (targetNumber) => {
      const { activeCall, localStream } = get();
      if (!activeCall) return;

      get().addTranscription('agent', `Initiating assisted transfer to ${targetNumber}. Placing client on hold...`);

      // Put customer call on hold
      set({ isHeld: true });
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }

      set({
        isConsulting: true,
        consultationState: 'calling',
        consultationNumber: targetNumber
      });

      // Simulate destination pickup after 1.5s
      setTimeout(() => {
        const state = get();
        if (state.isConsulting && state.consultationNumber === targetNumber) {
          set({ consultationState: 'connected' });
          get().addTranscription('bot', `Consultation line established with ${targetNumber}.`);
        }
      }, 1500);
    },

    completeAssistedTransfer: async () => {
      const { activeCall, consultationNumber, localStream, remoteStream } = get();
      if (!activeCall) return;

      get().addTranscription('agent', `Completing assisted transfer to ${consultationNumber}...`);
      get().addTranscription('bot', `Caller successfully connected to ${consultationNumber}. Line released.`);

      stopStreamTracks(localStream);
      stopStreamTracks(remoteStream);

      set({
        callState: 'idle',
        activeCall: null,
        agentStatus: 'available', // LIBERAR A DISPONIBLE
        screenPopOpen: false,
        callDuration: 0,
        transcriptionHistory: [],
        localStream: null,
        remoteStream: null,
        isHeld: false,
        isConsulting: false,
        consultationState: 'idle',
        consultationNumber: ''
      });
    },

    cancelAssistedTransfer: async () => {
      const { activeCall, localStream } = get();
      if (!activeCall) return;

      get().addTranscription('agent', `Cancelling consultation call. Resuming customer conversation...`);

      // Remove customer from hold
      set({
        isHeld: false,
        isConsulting: false,
        consultationState: 'idle',
        consultationNumber: ''
      });

      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = !get().isMuted;
        });
      }
    }
  };
});
