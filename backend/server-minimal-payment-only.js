/**
 * 💙 MINIMAL SERVER - PAYMENT SYSTEM ONLY (FOR THE KIDS)
 * Emergency production server for Dec 10 launch
 * Only loads routes that exist in container
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

// Only import routes that exist in container
import squareSubscriptionRoutes from './routes/square-subscriptions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FOR THE KIDS - Payment API',
    timestamp: new Date().toISOString(),
    mission: '60% → charity Children\'s Hospital'
  });
});

// Payment API Routes (CRITICAL FOR LAUNCH)
app.use('/api/subscriptions', squareSubscriptionRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '💙 FOR THE KIDS - Payment System Operational',
    status: 'LAUNCH READY',
    endpoints: {
      health: 'GET /health',
      subscriptionTest: 'GET /api/subscriptions/test',
      createCheckout: 'POST /api/subscriptions/create-checkout',
      webhook: 'POST /api/subscriptions/webhook'
    },
    mission: '60% of ALL revenue → charity Children\'s Hospital'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    mission: 'FOR THE KIDS - Please check the endpoint'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    mission: 'FOR THE KIDS - We will fix this!'
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 Payment API Server running on port ${PORT}`);
  logger.info(`💙 Mission: FOR THE KIDS!`);
  logger.info(`💰 Revenue: 60% → charity Children's Hospitals`);
  logger.info(`📊 Status: LAUNCH READY - December 10, 2025`);
});

export default app;
