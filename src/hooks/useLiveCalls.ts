import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Call } from '../types';
import { ivrService } from '../services/api';
import { useToast } from '../components/Toast';

/**
 * Hook que gestiona la conexión WebSocket STOMP con el ivr-service.
 * Se suscribe a /topic/live-calls y devuelve los datos en tiempo real.
 * Si el WebSocket falla, hace fallback silencioso con la lista vacía.
 */
export const useLiveCalls = () => {
  const [liveCalls, setLiveCalls] = useState<Call[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // 1. Obtener el estado inicial vía HTTP
    ivrService.getLiveCalls().then(initialCalls => {
      setLiveCalls(initialCalls);
    }).catch(err => console.error("Error fetching initial live calls:", err));

    // 2. Conectar WebSocket para recibir actualizaciones

    const client = new Client({
      // Usamos SockJS como transporte (con fallback automático)
      webSocketFactory: () => new SockJS('http://localhost:8082/ws'),
      reconnectDelay: 5000, // Reconectar cada 5s si se pierde la conexión

      onConnect: () => {
        console.log('[WebSocket] ✅ Conectado al ivr-service');
        setConnected(true);

        client.subscribe('/topic/live-calls', (message) => {
          try {
            const rawCalls = JSON.parse(message.body);
            // Transformar LiveCall[] del backend → Call[] del frontend
            const mapped: Call[] = rawCalls.map((c: any) => ({
              id: String(c.id),
              customerName: c.userName || 'Unknown Caller',
              phoneNumber: c.phoneNumber || '-',
              status: c.status === 'COMPLETED' ? 'completed'
                    : c.status === 'FAILED'    ? 'failed'
                    : 'in-progress',
              amount: 0,
              duration: c.timestamp
                ? `${Math.floor((Date.now() - new Date(c.timestamp).getTime()) / 60000)}m ${Math.floor(((Date.now() - new Date(c.timestamp).getTime()) % 60000) / 1000)}s`
                : '-',
              timestamp: c.timestamp
                ? new Date(c.timestamp).toLocaleTimeString()
                : '-',
            }));
            setLiveCalls((prevCalls) => {
              mapped.forEach(newCall => {
                const oldCall = prevCalls.find(c => c.id === newCall.id);
                // Si el estado cambió de in-progress a completed o failed
                if (oldCall && oldCall.status !== newCall.status) {
                  if (newCall.status === 'completed') {
                    toast('Payment Completed', `Payment from ${newCall.customerName} was successful.`, 'success');
                  } else if (newCall.status === 'failed') {
                    toast('Payment Failed', `Payment from ${newCall.customerName} failed.`, 'error');
                  }
                }
              });
              return mapped;
            });
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

    // Limpieza al desmontar el componente
    return () => {
      client.deactivate();
    };
  }, []);

  return { liveCalls, connected };
};
