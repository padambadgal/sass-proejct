import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Business from '../models/Business.js';

let io = null;

// ================================================================
// Authorization helper — checks if a user can access a business room
// ================================================================
const canAccessBusiness = async (user, businessId) => {
  if (!user || !businessId) return false;

  if (user.role !== 'owner') return false;

  // Verify the business actually exists AND the user is authorized
  const business = await Business.findById(businessId).select('ownerId').lean();
  if (!business) return false;

  return business.ownerId?.toString() === user._id.toString();
};

// ================================================================
// Socket initialization
// ================================================================
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // ---------- Auth middleware ----------
  io.use(async (socket, next) => {
    try {
      // Prefer cookie (httpOnly) — fallback to auth handshake
      const cookieToken = socket.handshake.headers?.cookie
        ?.split(';')
        ?.find((c) => c.trim().startsWith('token='))
        ?.split('=')[1];

      const token = socket.handshake.auth?.token || cookieToken;

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password').lean();

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach trusted user data to socket
      socket.userId = user._id.toString();
      socket.role = user.role;

      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ---------- Connection handler ----------
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: user=${socket.userId}, role=${socket.role}`);

    // Everyone joins their own personal room (for user-targeted events)
    socket.join(`user:${socket.userId}`);

    // ---------- Explicit room join (authorized) ----------
    socket.on('join:business', async (businessId, ack) => {
      try {
        if (!businessId || typeof businessId !== 'string') {
          if (typeof ack === 'function') ack({ ok: false, error: 'Invalid businessId' });
          return;
        }

        // Load the user from the database before authorizing room access.
        const user = await User.findById(socket.userId)
          .select('role isActive')
          .lean();

        if (!user || !user.isActive) {
          if (typeof ack === 'function') ack({ ok: false, error: 'User not found' });
          return;
        }

        const allowed = await canAccessBusiness(user, businessId);

        if (!allowed) {
          console.warn(
            `🚫 Socket join denied: user=${socket.userId} business=${businessId}`
          );
          if (typeof ack === 'function') ack({ ok: false, error: 'Not authorized' });
          return;
        }

        socket.join(`business:${businessId}`);
        console.log(`✅ Socket joined: user=${socket.userId} business=${businessId}`);

        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        console.error('join:business error:', err.message);
        if (typeof ack === 'function') ack({ ok: false, error: 'Server error' });
      }
    });

    // ---------- Optional: leave a business room ----------
    socket.on('leave:business', (businessId) => {
      if (typeof businessId === 'string') {
        socket.leave(`business:${businessId}`);
        console.log(`↩️  Socket left: user=${socket.userId} business=${businessId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// ================================================================
// Emit helpers (unchanged API — other code doesn't need to change)
// ================================================================
export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export const emitToBusiness = (businessId, event, payload) => {
  if (io && businessId) {
    io.to(`business:${businessId}`).emit(event, payload);
  }
};

export const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};