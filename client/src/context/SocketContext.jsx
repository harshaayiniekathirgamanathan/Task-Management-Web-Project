import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect once the user is logged in (has a token)
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token },     // the server reads this in its handshake check
      reconnection: true,  // automatically retry if the connection drops
    });

    setSocket(newSocket);

    // Clean up: disconnect on logout, token change, or unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

// Lets any component do: const socket = useSocket();
export function useSocket() {
  return useContext(SocketContext);
}