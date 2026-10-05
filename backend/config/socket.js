import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie
        ?.split('token=')[1]?.split(';')[0];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.role = user.role;
      socket.businessId = user.businessId?.toString() || null;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: user=${socket.userId}, role=${socket.role}`);

    // Each user joins their own room
    socket.join(`user:${socket.userId}`);

    // Owner joins a business room for real-time booking alerts
    if (socket.businessId) {
      socket.join(`business:${socket.businessId}`);
    }

    socket.on('join:business', (businessId) => {
      // Owner can join any business they own (validated client-side)
      socket.join(`business:${businessId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

// Emit to a specific business (owner dashboards)
export const emitToBusiness = (businessId, event, payload) => {
  if (io) io.to(`business:${businessId}`).emit(event, payload);
};

// Emit to a specific user
export const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};