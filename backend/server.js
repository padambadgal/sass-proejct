import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
// import cors from 'cors';
dotenv.config();


import userRouter from './routes/userRouter.js';
import { errorHandler } from './middleware/errorMiddleware.js';


const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(cookieParser());
// app.use(cors({
//     origin: 'http://localhost:5173', // Replace with your frontend URL
//     credentials: true, // Allow cookies to be sent
// }));

app.use('/api/auth', userRouter);


app.use(errorHandler);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});