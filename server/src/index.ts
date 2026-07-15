// server/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import guardRoutes from './routes/guardRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import rosterRoutes from './routes/rosterRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust Render reverse proxy for accurate IP rate limiting
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Establish Database Connection
connectDB();

// 2. Setup Central Middleware Stack
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('https://atharva1811.github.io')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// 3. Mount Rate Limiters on general API routes
app.use('/api/', apiRateLimiter);

// 4. Map Route Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/guards', guardRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/roster', rosterRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/users', userRoutes);

// Root heartbeat check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Guard Duty API backend is running.' });
});

// 5. Centralized Error Handler
app.use(errorHandler);

// 6. Start listening
app.listen(PORT, () => {
  console.log(`🚀 Node.js + Express server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
