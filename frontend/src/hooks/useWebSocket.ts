import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = (groupId: string | undefined) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!groupId || !token) return;

    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    // Convert http/https to ws/wss if needed
    let cleanWsUrl = wsBaseUrl;
    if (cleanWsUrl.startsWith('http://')) {
      cleanWsUrl = cleanWsUrl.replace('http://', 'ws://');
    } else if (cleanWsUrl.startsWith('https://')) {
      cleanWsUrl = cleanWsUrl.replace('https://', 'wss://');
    }

    const wsUrl = `${cleanWsUrl}/groups/${groupId}?token=${token}`;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const eventType = data.event;

            if (
              [
                'transaction_created',
                'transaction_updated',
                'transaction_deleted',
                'balance_updated',
                'settlement_created',
                'member_joined',
                'member_removed',
              ].includes(eventType)
            ) {
              // Invalidate TanStack queries for real-time reactivity
              queryClient.invalidateQueries({ queryKey: ['transactions', groupId] });
              queryClient.invalidateQueries({ queryKey: ['balance', groupId] });
              queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
              queryClient.invalidateQueries({ queryKey: ['group', groupId] });
              queryClient.invalidateQueries({ queryKey: ['groups'] });
            }
          } catch {
            // Ignore malformed WS frames
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };

        socketRef.current = ws;
      } catch {
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [groupId, token, queryClient]);

  return { isConnected };
};
