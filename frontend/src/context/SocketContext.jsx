import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('authToken');
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:5000';

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Real-time booking events
    socket.on('booking:new', (payload) => {
      const notif = {
        id: Date.now(),
        type: 'booking',
        title: 'New Booking!',
        message: `${payload.customerName} booked ${payload.serviceName} on ${new Date(
          payload.date
        ).toLocaleDateString()} at ${payload.startTime}`,
        data: payload,
        read: false,
        createdAt: new Date(),
      };
      setNotifications((prev) => [notif, ...prev]);
      toast.success(`📅 New booking from ${payload.customerName}!`, {
        duration: 5000,
      });
    });

    socket.on('booking:status', (payload) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.data?.bookingReference === payload.bookingReference
            ? { ...n, read: true }
            : n
        )
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  const markAsRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const clearAll = () => setNotifications([]);

  const value = {
    socket: socketRef.current,
    connected,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    markAsRead,
    clearAll,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);