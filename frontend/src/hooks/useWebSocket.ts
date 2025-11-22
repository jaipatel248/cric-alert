import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertMonitor, RecentAlert } from "../types";

export enum WebSocketMessageType {
  MONITOR_UPDATE = 'monitor_update',
  NEW_ALERT = 'new_alert',
  STATUS_CHANGE = 'status_change',
  EXPECTED_NEXT_CHECK_UPDATE = 'expected_next_check_update',
  PONG = 'pong',
}

export type WebSocketData = 
  | { type: WebSocketMessageType.MONITOR_UPDATE; data: Partial<AlertMonitor> }
  | { type: WebSocketMessageType.NEW_ALERT; data: Pick<AlertMonitor, 'monitor_id'> & { alert: RecentAlert } }
  | { type: WebSocketMessageType.STATUS_CHANGE; data: Pick<AlertMonitor, 'monitor_id' | 'status' | 'running'> }
  | { type: WebSocketMessageType.EXPECTED_NEXT_CHECK_UPDATE; data: Pick<AlertMonitor, 'monitor_id' | 'expectedNextCheck'> }
  | { type: WebSocketMessageType.PONG };

export type WebSocketMessage = WebSocketData;

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (
  monitorId: string | undefined,
  options: UseWebSocketOptions = {}
) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  // Store callbacks in refs to avoid reconnection on callback changes
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  }, [onMessage, onConnect, onDisconnect, onError]);

  const connect = useCallback(() => {
    if (!monitorId || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.REACT_APP_WS_URL || "localhost:8000";
      const wsUrl = `${protocol}//${host}/api/v1/ws/${monitorId}`;

      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnectRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(parsed);
          onMessageRef.current?.(parsed);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        onErrorRef.current?.(error);
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;
        onDisconnectRef.current?.();

        // Attempt reconnection
        if (
          shouldReconnectRef.current &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("❌ Max reconnection attempts reached");
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [monitorId, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  const refresh = useCallback(() => {
    sendMessage("refresh");
  }, [sendMessage]);

  useEffect(() => {
    if (monitorId) {
      shouldReconnectRef.current = true;
      connect();
    }

    return () => {
      disconnect();
    };
  }, [monitorId, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    refresh,
    disconnect,
  };
};
