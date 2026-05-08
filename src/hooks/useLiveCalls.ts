import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Call } from '../types';
import { ivrService } from '../services/api';
import { useToast } from '../components/Toast';

/**
 * Hook que gestiona la conexión WebSocket STOMP con el ivr-service.
 */
export const useLiveCalls = () => {
  const [liveCalls, setLiveCalls] = useState<Call[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const { toast } = useToast();
  
  // Guardamos las llamadas anteriores en un Ref para comparar cambios de estado sin disparar re-renders innecesarios
  const prevCallsRef = useRef<Call[]>([]);

  useEffect(() => {
    // 1. Obtener el estado inicial vía HTTP
    ivrService.getLiveCalls().then(initialCalls => {
      setLiveCalls(initialCalls);
      prevCallsRef.current = initialCalls;
    }).catch(err => console.error("Error fetching initial live calls:", err));

    // 2. Conectar WebSocket para recibir actualizaciones
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('[WebSocket] ✅ Conectado al ivr-service');
        setConnected(true);

        client.subscribe('/topic/live-calls', (message) => {
          try {
            const rawCalls = JSON.parse(message.body);
            
            // Transformar datos del backend al formato del frontend
            const mapped: Call[] = rawCalls.map((c: any) => ({
              id: String(c.id),
              customerName: c.userName || 'Unknown Caller',
              phoneNumber: c.phoneNumber || '-',
              status: c.status === 'COMPLETED' ? 'completed'
                    : c.status === 'FAILED'    ? 'failed'
                    : 'in-progress',
              amount: Number(c.callAmount) || 0,
              duration: c.timestamp
                ? `${Math.floor((Date.now() - new Date(c.timestamp).getTime()) / 60000)}m ${Math.floor(((Date.now() - new Date(c.timestamp).getTime()) % 60000) / 1000)}s`
                : '-',
              timestamp: c.timestamp
                ? new Date(c.timestamp).toLocaleTimeString()
                : '-',
            }));

            // 🔔 Lógica de Notificaciones (FUERA del setState)
            mapped.forEach(newCall => {
              const oldCall = prevCallsRef.current.find(c => c.id === newCall.id);
              
              // Solo disparamos toast si el estado ha cambiado a finalizado/fallido
              if (oldCall && oldCall.status === 'in-progress' && newCall.status !== 'in-progress') {
                if (newCall.status === 'completed') {
                  toast('Payment Completed', `Payment from ${newCall.customerName} was successful.`, 'success');
                } else if (newCall.status === 'failed') {
                  toast('Payment Failed', `Payment from ${newCall.customerName} failed.`, 'error');
                }
              }
            });

            // Actualizamos tanto el estado como la referencia
            setLiveCalls(mapped);
            prevCallsRef.current = mapped;
            
          } catch (err) {
            console.error('[WebSocket] Error parsing live calls:', err);
          }
        });
      },

      onDisconnect: () => {
        console.log('[WebSocket] ❌ Desconectado del ivr-service');
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error('[WebSocket] Error STOMP:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [toast]); // Añadimos toast a las dependencias por seguridad

  return { liveCalls, connected };
};
