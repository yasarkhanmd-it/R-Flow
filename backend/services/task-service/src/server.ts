import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import './models/userModel';
import './models/projectModel';
import './models/moduleModel';
import './models/departmentModel';
import './models/workflowStageModel';
import './models/taskModel';
import './models/commentModel';
import './models/attachmentModel';
import './models/activityLogModel';
import './models/notificationModel';
import './models/workLogModel';
import * as taskController from './controllers/task.controller';
import * as commentController from './controllers/comment.controller';
import * as attachmentController from './controllers/attachment.controller';
import * as activityLogController from './controllers/activityLog.controller';
import * as worklogController from './controllers/worklog.controller';
import { protect } from '../../../common/middleware/auth.middleware';
import { errorHandler } from '../../../common/middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rflow';

app.use(cors());
app.use(express.json());

// Tasks Routes
app.get('/api/tasks', protect, taskController.getTasks);
app.post('/api/tasks', protect, taskController.createTask);
app.put('/api/tasks/:id', protect, taskController.updateTask);
app.post('/api/tasks/:id/clarification', protect, taskController.requestClarification);
app.delete('/api/tasks/:id', protect, taskController.deleteTask);

// WorkLog Routes
app.get('/api/tasks/:taskId/worklogs', protect, worklogController.getTaskWorkLogs);
app.post('/api/tasks/:taskId/worklogs', protect, worklogController.addWorkLog);
app.delete('/api/tasks/worklogs/:logId', protect, worklogController.deleteWorkLog);

// Comments Routes
app.get('/api/comments/:targetType/:targetId', protect, commentController.getComments);
app.post('/api/comments', protect, commentController.addComment);

// Attachments Routes
app.get('/api/attachments/:targetType/:targetId', protect, attachmentController.getAttachments);
app.post('/api/attachments', protect, attachmentController.uploadAttachment);
app.delete('/api/attachments/:id', protect, attachmentController.deleteAttachment);

// Activities Routes
app.get('/api/activities/:targetType/:targetId', protect, activityLogController.getActivities);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'task-service' });
});

app.use(errorHandler);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Task Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Task Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
