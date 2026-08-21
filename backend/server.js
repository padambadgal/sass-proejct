import express from 'express';
import connectDB from './config/db.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';


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

import { errorHandler } from './middleware/errorMiddleware.js';


const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(helmet());
app.use(express.json());
app.use(cookieParser());


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});


app.use('/api/auth', limiter);


const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
        success: false,
        message: 'Too many requests, please slow down.'
    }
});


app.use('/api', globalLimiter);


app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend URL
    credentials: true, // Allow cookies to be sent
}));

app.use('/api/auth', userRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/business', businessRoutes);
app.use('/api/services', serviceRoutes)
app.use('/api/staff', staffRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ✅ 7. Global Error Handler (MUST be the last middleware)
app.use(errorHandler);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});