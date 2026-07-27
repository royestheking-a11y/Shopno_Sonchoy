import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  updateTicker: number;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  updateTicker: 0,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [updateTicker, setUpdateTicker] = useState(0);

  useEffect(() => {
    // Determine the API URL
    const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    // We only need the origin for the socket connection
    const socketUrl = new URL(apiUrl).origin;
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    newSocket.on('data_updated', () => {
      console.log('Received data_updated event from server');
      setUpdateTicker((prev) => prev + 1);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, updateTicker }}>
      {children}
    </SocketContext.Provider>
  );
};
