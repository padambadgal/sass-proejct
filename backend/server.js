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
import profileRoutes from './routes/profileRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
// import { uploadErrorHandler } from "./middleware/uploadErrorHandler.js";

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
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

app.use('/api/profile', profileRoutes);

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


app.use((err, req, res, next) => {
  // Handle known upload errors only.
  const isUploadError =
    err.name === "MulterError" ||
    typeof err.http_code === "number" ||
    Array.isArray(err.storageErrors);

  if (isUploadError) {
    // Log details on the server, not in the response.
    console.error("Upload error:", {
      name: err.name,
      message: err.message,
      http_code: err.http_code,
    });

    const status =
      err.code === "LIMIT_FILE_SIZE" ? 413 :
        err.name === "MulterError" ? 400 :
          Number.isInteger(err.http_code) &&
            err.http_code >= 400 &&
            err.http_code < 500 ? err.http_code :
            500;

    return res.status(status).json({
      success: false,
      message:
        status === 413
          ? "Uploaded file is too large"
          : status === 400
            ? "Invalid uploaded file"
            : status === 500
              ? "Upload failed. Please try again."
              : "Upload could not be completed",
    });
  }

  // Pass all non-upload errors to the standard handler.
  next(err);
});


// app.use(uploadErrorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Standard error handler must be last
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});