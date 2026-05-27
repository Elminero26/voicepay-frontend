import { useEffect } from 'react';
import { useToast } from '../../../components/Toast';
import { useCallStore } from '../../../stores/useCallStore';

/**
 * Hook que gestiona la conexión WebSocket a través del almacén global de Zustand (useCallStore).
 */
export const useLiveCalls = () => {
  const { toast } = useToast();
  const liveCalls = useCallStore((state) => state.liveCalls);
  const connected = useCallStore((state) => state.connected);
  const connectWebSocket = useCallStore((state) => state.connectWebSocket);

  useEffect(() => {
    connectWebSocket(toast);
  }, [connectWebSocket, toast]);

  return { liveCalls, connected };
};
