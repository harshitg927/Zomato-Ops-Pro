import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext({});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log("Connecting to socket server...");

      const socketUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
      const newSocket = io(socketUrl, {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        setConnected(true);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        console.log("Cleaning up socket connection");
        newSocket.close();
      };
    } else {
      // Disconnect socket if user is not authenticated
      if (socket) {
        console.log("User not authenticated, disconnecting socket");
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, token]);

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
