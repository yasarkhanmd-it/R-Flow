import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
const proxy = require('express-http-proxy');
import { requestLogger } from '../../../common/middleware/logger.middleware';
import { errorHandler } from '../../../common/middleware/error.middleware';
import { verifyToken } from '../../../common/auth/jwt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const PROJECT_SERVICE_URL = process.env.PROJECT_SERVICE_URL || 'http://localhost:5002';
const STORY_SERVICE_URL = process.env.STORY_SERVICE_URL || 'http://localhost:5003';
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || 'http://localhost:5004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005';
const DASHBOARD_SERVICE_URL = process.env.DASHBOARD_SERVICE_URL || 'http://localhost:5006';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:5007';

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));
app.use(requestLogger);
app.use(express.json());

// ── JWT Decorator Helper ──────────────────────────────────────────────
const proxyOptions = {
  proxyReqPathResolver: (req: Request) => req.originalUrl,
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => {
    const authHeader = srcReq.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = verifyToken(token);
        proxyReqOpts.headers['x-user-id'] = decoded.id || decoded._id;
        proxyReqOpts.headers['x-user-role'] = decoded.role;
      } catch (err) {
        // Token verification error handled downstream by auth middleware
      }
    }
    return proxyReqOpts;
  },
  // Strip CORS headers from upstream responses — Express cors() middleware handles them
  userResDecorator: (_proxyRes: any, proxyResData: any, _userReq: any, _userRes: any) => {
    return proxyResData;
  },
  userResHeaderDecorator: (headers: any) => {
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = 'GET,POST,PUT,DELETE,OPTIONS,PATCH';
    headers['access-control-allow-headers'] = 'Content-Type,Authorization,x-user-id,x-user-role';
    return headers;
  }
};

// ── Health Check ──────────────────────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: 'API Gateway',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ── Microservice Proxies ──────────────────────────────────────────────
// Auth Service Routes
app.use('/api/auth', proxy(AUTH_SERVICE_URL, proxyOptions));
app.use('/api/users', proxy(AUTH_SERVICE_URL, proxyOptions));
app.use('/api/departments', proxy(PROJECT_SERVICE_URL, proxyOptions));

// Vertical Routes (handled by project-service)
app.use('/api/verticals', proxy(PROJECT_SERVICE_URL, proxyOptions));

// Story Service Routes (Specific match before general project routes)
app.use('/api/projects/:projectId/modules', proxy(STORY_SERVICE_URL, proxyOptions));
app.use('/api/modules', proxy(STORY_SERVICE_URL, proxyOptions));

// Project Service Routes
app.use('/api/projects', proxy(PROJECT_SERVICE_URL, proxyOptions));

// Task Service Routes
app.use('/api/tasks', proxy(TASK_SERVICE_URL, proxyOptions));
app.use('/api/comments', proxy(TASK_SERVICE_URL, proxyOptions));
app.use('/api/attachments', proxy(TASK_SERVICE_URL, proxyOptions));
app.use('/api/activities', proxy(TASK_SERVICE_URL, proxyOptions));

// Notification Service Routes
app.use('/api/notifications', proxy(NOTIFICATION_SERVICE_URL, proxyOptions));

// Dashboard Service Routes
app.use('/api/dashboard', proxy(DASHBOARD_SERVICE_URL, proxyOptions));

// Report Service Routes
app.use('/api/reports', proxy(REPORT_SERVICE_URL, proxyOptions));

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
