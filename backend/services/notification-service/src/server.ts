import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as notificationController from './controllers/notification.controller';
import { protect } from '../../../common/middleware/auth.middleware';
import { errorHandler } from '../../../common/middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rflow';

app.use(cors());
app.use(express.json());

// Notifications Routes
app.post('/api/notifications/audit', protect, notificationController.createAuditLog);
app.get('/api/notifications/unread-count', protect, notificationController.getUnreadCount);
app.get('/api/notifications/audit-logs', protect, notificationController.getAuditLogs);
app.get('/api/notifications', protect, notificationController.getNotifications);
app.put('/api/notifications/read-all', protect, notificationController.markAllAsRead);
app.put('/api/notifications/:id/read', protect, notificationController.markAsRead);
app.post('/api/notifications/:id/approve', protect, notificationController.approveRequest);
app.post('/api/notifications/:id/reject', protect, notificationController.rejectRequest);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' });
});

app.use(errorHandler);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Notification Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Notification Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
