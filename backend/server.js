import express from 'express';
import http from 'http';
import connectDB from './config/db.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectRedis } from './config/redis.js';
import { initSocket } from './config/socket.js';

// Routes
import userRouter from './routes/authRouter.js';
import subscriptionRouter from './routes/subscriptionRouter.js';
import paymentRouter from './routes/paymentRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ✅ Init services
await connectDB();
await connectRedis();
initSocket(server);

// ✅ Webhook raw body FIRST (before json parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ✅ CORS
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// ✅ Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, try again later.' },
});
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

app.use('/api/auth', authLimiter);
app.use('/api', globalLimiter);

// ✅ Routes
app.use('/api/auth', userRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/business', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});