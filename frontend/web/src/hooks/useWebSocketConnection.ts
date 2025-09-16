import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setConnectionStatus } from '../store/slices/tradingSlice';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export const useWebSocketConnection = () => {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = () => {
    try {
      dispatch(setConnectionStatus('connecting'));
      
      const ws = new WebSocket('ws://localhost:3003/ws/all');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        dispatch(setConnectionStatus('connected'));
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          // Handle different message types
          switch (message.type) {
            case 'market_data':
              // Update market data
              break;
            case 'trade_signal':
              // Handle trade signals
              break;
            case 'portfolio_update':
              // Handle portfolio updates
              break;
            case 'fraud_alert':
              // Handle fraud alerts
              break;
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        dispatch(setConnectionStatus('disconnected'));
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectDelay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch(setConnectionStatus('disconnected'));
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      dispatch(setConnectionStatus('disconnected'));
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    dispatch(setConnectionStatus('disconnected'));
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  useEffect(() => {
    // Connect on mount
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts,
  };
};
