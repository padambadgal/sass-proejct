import express from 'express';
import connectDB from './config/db.js';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';


import userRouter from './routes/userRouter.js';
import subscriptionRouter from './routes/subscriptionRouter.js';
import paymentRouter from './routes/paymentRoutes.js';
import businessRoutes from './routes/businessRoutes.js'; 
import serviceRoutes from './routes/serviceRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import slotRoutes from './routes/slotRoutes.js';

import { errorHandler } from './middleware/errorMiddleware.js';


const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cookieParser());
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