"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: string | null;
  sendMessage: (message: any) => void;
  subscribe: (rooms: string[]) => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Subscribe to default rooms
      newSocket.emit("subscribe", {
        rooms: [
          "dashboard:overview",
          "metrics:realtime",
          "alerts:all",
          "projects:status",
          "resources:utilization",
        ],
      });
    });

    newSocket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    // Listen for dashboard updates
    newSocket.on("dashboard:update", (data) => {
      setLastMessage(JSON.stringify(data));
    });

    newSocket.on("metrics:update", (data) => {
      setLastMessage(JSON.stringify(data));
    });

    newSocket.on("alerts:new", (data) => {
      setLastMessage(JSON.stringify(data));
    });

    newSocket.on("projects:update", (data) => {
      setLastMessage(JSON.stringify(data));
    });

    newSocket.on("resources:update", (data) => {
      setLastMessage(JSON.stringify(data));
    });

    setSocket(newSocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.close();
    };
  }, []);

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.emit("message", message);
    }
  };

  const subscribe = (rooms: string[]) => {
    if (socket && isConnected) {
      socket.emit("subscribe", { rooms });
    }
  };

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
  };
}