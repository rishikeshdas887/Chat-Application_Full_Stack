import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

/**
 * Custom hook managing WebSocket/STOMP connection for real-time chat.
 *
 * @param {Object} params
 * @param {string|null} params.token - JWT token for STOMP CONNECT header
 * @param {number|string|null} params.conversationId - Current conversation ID to subscribe to
 * @param {Function} params.onMessage - Callback invoked when a message arrives
 */
export const useWebSocket = ({ token, conversationId, onMessage }) => {
  const [connectionStatus, setConnectionStatus] = useState(() => (token ? 'connecting' : 'disconnected'));
  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const conversationIdRef = useRef(conversationId);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => {
        setConnectionStatus('disconnected');
      }, 0);
      return () => clearTimeout(timer);
    }

    const connectTimer = setTimeout(() => {
      setConnectionStatus('connecting');
    }, 0);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWsUrl = `${protocol}//${window.location.host}/ws`;
    const brokerURL = import.meta.env.VITE_WS_URL || defaultWsUrl;

    const client = new Client({
      brokerURL: brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        // Guard against callbacks from a replaced client instance
        if (clientRef.current !== client) return;

        setConnectionStatus('connected');

        // Subscribe to currently active conversation
        const activeId = conversationIdRef.current;
        if (activeId) {
          const destination = `/topic/conversations/${activeId}`;
          subscriptionRef.current = client.subscribe(destination, (stompMessage) => {
            try {
              const payload = JSON.parse(stompMessage.body);
              if (typeof onMessageRef.current === 'function') {
                onMessageRef.current(payload);
              }
            } catch (err) {
              console.error('Failed to parse incoming WebSocket message:', err);
            }
          });
        }
      },
      onDisconnect: () => {
        // Only update status and subscription if this is the active client
        if (clientRef.current === client) {
          setConnectionStatus('disconnected');
          subscriptionRef.current = null;
        }
      },
      onStompError: (frame) => {
        if (clientRef.current === client) {
          console.warn('STOMP protocol error:', frame.headers?.message || 'STOMP error');
          setConnectionStatus('error');
        }
      },
      onWebSocketError: (event) => {
        if (clientRef.current === client) {
          console.warn('WebSocket transport error:', event);
          setConnectionStatus('error');
        }
      },
      onWebSocketClose: () => {
        if (clientRef.current === client) {
          setConnectionStatus('disconnected');
        }
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      clearTimeout(connectTimer);
      if (clientRef.current === client) {
        clientRef.current = null;
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (client.active) {
        client.deactivate();
      }
    };
  }, [token]);

  // Handle switching active conversation topic
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (conversationId) {
      const destination = `/topic/conversations/${conversationId}`;
      subscriptionRef.current = client.subscribe(destination, (stompMessage) => {
        try {
          const payload = JSON.parse(stompMessage.body);
          if (typeof onMessageRef.current === 'function') {
            onMessageRef.current(payload);
          }
        } catch (err) {
          console.error('Failed to parse incoming WebSocket message:', err);
        }
      });
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    (content, type = 'TEXT') => {
      const client = clientRef.current;
      if (client && client.connected && conversationId) {
        client.publish({
          destination: `/app/conversations/${conversationId}/send`,
          body: JSON.stringify({ content, type }),
        });
        return true;
      }
      return false;
    },
    [conversationId]
  );

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    sendMessage,
  };
};

export default useWebSocket;
