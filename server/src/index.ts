// Import telemetry first
import './config/telemetry';

import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load and validate environment variables
import env from './config/env';
import { logConfigurationStatus } from './config/env';
import { initializeSentry } from './config/sentry';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { rateLimiter } from './middleware/rateLimiter';
import { metricsMiddleware, startSystemMetricsCollection } from './middleware/metrics';
import { requestLoggingMiddleware, errorLoggingMiddleware, logger } from './middleware/logging';
import { metricsHandler, metrics, updateHealthStatus } from './utils/monitoring';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import matchRoutes from './routes/matches';
import chatRoutes from './routes/chat';
import paymentRoutes from './routes/payments';
import companyDomainRoutes from './routes/companyDomain';
import contentFilterRoutes from './routes/contentFilter';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/admin';
import locationRoutes from './routes/location';
import videoCallRoutes from './routes/videoCallRoutes';
import storyRoutes from './routes/storyRoutes';

const app = express();

// Initialize Sentry before other middleware
initializeSentry(app);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// PORT is declared later

// Compression middleware
import compression from 'compression';
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress responses with no-compress header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:19000',
    'http://localhost:19001',
    'http://localhost:19002'
  ],
  credentials: true
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan('combined'));

// Metrics middleware
app.use(metricsMiddleware);

// Request logging
app.use(requestLoggingMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    updateHealthStatus('database', true);
    updateHealthStatus('server', true);
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'glimpse-server',
      checks: {
        database: 'healthy',
        server: 'healthy'
      }
    });
  } catch (error) {
    updateHealthStatus('database', false);
    res.status(503).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'glimpse-server',
      checks: {
        database: 'unhealthy',
        server: 'healthy'
      }
    });
  }
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', metricsHandler);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Glimpse API Documentation'
}));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/video-calls', videoCallRoutes);
app.use('/api/v1/stories', storyRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/company', companyDomainRoutes);
app.use('/api/v1/content-filter', contentFilterRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/location', locationRoutes);

// Initialize Socket.IO chat handlers
import { initializeChatSocket } from './socket/chatSocket';
initializeChatSocket(io);

// Track WebSocket connections for monitoring
io.on('connection', (socket) => {
  metrics.websocketConnectionsActive.inc();
  
  socket.on('disconnect', () => {
    metrics.websocketConnectionsActive.dec();
  });
});

// Import cron service
import { cronService } from './services/CronService';

// Sentry handlers are now integrated differently in v7+
// The error handler is integrated through errorHandler middleware

// Error handling middleware
app.use(notFound);
app.use(errorLoggingMiddleware);
app.use(errorHandler);

// Start server
const PORT = env.PORT || 3001;
server.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: env.NODE_ENV,
    frontendUrl: env.FRONTEND_URL
  });
  
  console.log(`🚀 Glimpse Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics endpoint: http://localhost:${PORT}/metrics`);
  
  // Log configuration status
  logConfigurationStatus();
  
  // Start system metrics collection
  startSystemMetricsCollection();
  
  // Start cron jobs
  cronService.start();
  console.log(`⏰ Cron jobs started`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  cronService.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export { app, io };