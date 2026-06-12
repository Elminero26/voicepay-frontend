import { useEffect, useRef } from 'react';
import { useCallStore } from '../stores/useCallStore';
import { useAgentStore } from '../stores/useAgentStore';
import { useLanguage } from './useLanguage';

export const useAgentCallSync = () => {
  const { t } = useLanguage();
  const {
    liveCalls,
    isSimulating,
    simStep,
    simPath,
    stopSimulation,
    transcriptions,
    addNotification,
    toastFn
  } = useCallStore();

  const {
    agentStatus,
    callState,
    activeCall,
    receiveIncomingCall,
    hangUp,
    declineCall,
    addTranscription,
    clearTranscriptionHistory
  } = useAgentStore();

  const lastSimStepRef = useRef(0);
  const handledCallsRef = useRef<Set<string>>(new Set());
  const lastCallStateRef = useRef(callState);
  const mockTransTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      mockTransTimerRefs.current.forEach(clearTimeout);
    };
  }, []);

  // 1. Sync local simulation
  useEffect(() => {
    if (!isSimulating) {
      lastSimStepRef.current = 0;
      // If we are in a simulated call and simulation stopped, hang up
      if (activeCall?.id === 'sim-call-999' && callState !== 'idle') {
        hangUp();
      }
      return;
    }

    // When step transitions to 6 on the 'agent' path
    if (simPath === 'agent' && simStep === 6 && lastSimStepRef.current !== 6) {
      lastSimStepRef.current = 6;

      if (agentStatus === 'available') {
        if (callState === 'idle') {
          receiveIncomingCall({
            id: 'sim-call-999',
            customerName: t('ivr.speech_bubbles.sim_call_name', 'Carlos Prueba (Simulado)'),
            phoneNumber: '+34 600 111 222',
            status: 'in-progress',
            amount: 150.00,
            timestamp: new Date().toLocaleTimeString(),
            selectedOption: '2',
            direction: 'inbound',
            callEvents: [
              t('ivr.simulator.step_1', 'Receiving incoming call...'),
              t('ivr.simulator.step_2', 'Authenticating user via CallerID...'),
              t('ivr.simulator.step_3', 'Evaluating condition: VIP Customer? -> YES. Routing to pending balance inquiry...'),
              t('ivr.simulator.step_4', 'Playing IVR options menu...'),
              t('ivr.simulator.step_5', { opt: '2', defaultValue: 'Selection entered [Option 2]' }),
              t('ivr.simulator.step_6_agent', 'Connecting directly to agent...')
            ]
          });
        }
      } else {
        // Agent not available -> Missed Call
        const title = t('agent.missed_call', 'Llamada perdida');
        const desc = t('agent.missed_call_desc', {
          name: t('ivr.speech_bubbles.sim_call_name', 'Carlos Prueba'),
          phone: '+34 600 111 222'
        });
        
        if (toastFn) {
          toastFn(title, desc, 'warning');
        }
        addNotification(title, desc, 'warning');
        
        // End simulation since agent couldn't pick up
        stopSimulation();
      }
    }

    // If simulation was running but user stopped it, reset softphone if in simulated call
    if (simStep === 0 && activeCall?.id === 'sim-call-999') {
      declineCall();
    }
  }, [isSimulating, simStep, simPath, agentStatus, callState, activeCall, receiveIncomingCall, declineCall, hangUp, stopSimulation, toastFn, addNotification, t]);

  // 2. Sync softphone hangup/decline back to simulation
  useEffect(() => {
    // If agent declined or hung up a simulated call, stop the simulation
    if (
      lastCallStateRef.current !== 'idle' &&
      callState === 'idle' &&
      isSimulating &&
      simPath === 'agent'
    ) {
      stopSimulation();
    }
    lastCallStateRef.current = callState;
  }, [callState, isSimulating, simPath, stopSimulation]);

  // 3. Sync live WebSocket calls
  useEffect(() => {
    if (isSimulating) return; // Ignore live sync if simulating

    // Find any live call that is transferred to agent
    // E.g. in-progress call and selectedOption is '2' (agent)
    liveCalls.forEach((call) => {
      if (call.status === 'in-progress' && call.selectedOption === '2') {
        if (!handledCallsRef.current.has(call.id)) {
          handledCallsRef.current.add(call.id);

          if (agentStatus === 'available' && callState === 'idle') {
            receiveIncomingCall(call);
          } else {
            // Agent Busy/Offline -> Missed Call
            const title = t('agent.missed_call', 'Llamada perdida');
            const desc = t('agent.missed_call_desc', {
              name: call.customerName || 'Unknown Caller',
              phone: call.phoneNumber || '-'
            });

            if (toastFn) {
              toastFn(title, desc, 'warning');
            }
            addNotification(title, desc, 'warning');
          }
        }
      }
    });
  }, [liveCalls, isSimulating, agentStatus, callState, receiveIncomingCall, toastFn, addNotification, t]);

  // 4. Handle Transcriptions (WebSocket & Simulation)
  useEffect(() => {
    if (callState !== 'active' || !activeCall) {
      // Clear timers if call ends
      mockTransTimerRefs.current.forEach(clearTimeout);
      mockTransTimerRefs.current = [];
      return;
    }

    // A. Live WebSocket transcription sync
    if (activeCall.id !== 'sim-call-999') {
      const activeTrans = transcriptions[activeCall.id];
      if (activeTrans) {
        // If it's a real call, add to history
        addTranscription('user', activeTrans);
      }
      return;
    }

    // B. Mock simulation transcriptions
    if (activeCall.id === 'sim-call-999') {
      // Clear any existing simulation timers just in case
      mockTransTimerRefs.current.forEach(clearTimeout);
      mockTransTimerRefs.current = [];
      clearTranscriptionHistory();

      // Trigger sequential dialogue
      const scheduleMockText = (role: 'bot' | 'user' | 'agent', text: string, delay: number) => {
        const timer = setTimeout(() => {
          addTranscription(role, text);
        }, delay);
        mockTransTimerRefs.current.push(timer);
      };

      scheduleMockText(
        'user',
        t('ivr.speech_bubbles.user_bubble_1', 'Hola, buenas. Quería pagar una factura pendiente.'),
        1500
      );
      
      scheduleMockText(
        'agent',
        'Hola Carlos, buenas tardes. Entiendo que desea pagar su factura de 150 euros. ¿Me confirma su número de tarjeta?',
        4500
      );
      
      scheduleMockText(
        'user',
        t('ivr.speech_bubbles.user_bubble_3', 'Sí, quiero hacer el pago de la factura de ciento cincuenta euros con mi tarjeta bancaria.'),
        7500
      );

      scheduleMockText(
        'agent',
        'Perfecto, estoy iniciando la pasarela de pago seguro VoicePay. Escuchará un tono de confirmación en su terminal para completar la transacción de manera cifrada.',
        10500
      );

      scheduleMockText(
        'user',
        t('ivr.speech_bubbles.user_bubble_5', 'Perfecto, pago confirmado. Muchas gracias por la rapidez. Adiós.'),
        14000
      );
      
      scheduleMockText(
        'agent',
        'Gracias a usted por confiar en VoicePay. Que tenga un excelente día. ¡Hasta pronto!',
        16500
      );
    }
  }, [callState, activeCall, transcriptions, addTranscription, clearTranscriptionHistory, t]);
};
