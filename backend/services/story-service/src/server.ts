import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import './models/userModel';
import './models/projectModel';
import './models/moduleModel';
import './models/taskModel';
import './models/commentModel';
import './models/attachmentModel';
import './models/activityLogModel';
import './models/notificationModel';
import * as moduleController from './controllers/module.controller';
import { protect } from '../../../common/middleware/auth.middleware';
import { errorHandler } from '../../../common/middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rflow';

app.use(cors());
app.use(express.json());

// Story / Module Routes
app.get('/api/modules', protect, moduleController.getAllModules);
app.get('/api/modules/:id', protect, moduleController.getModuleById);
app.get('/api/projects/:projectId/modules', protect, moduleController.getModules);
app.post('/api/modules', protect, moduleController.createModule);
app.put('/api/modules/:id', protect, moduleController.updateModule);
app.post('/api/modules/:id/approve', protect, moduleController.approveModule);
app.post('/api/modules/:id/reject', protect, moduleController.rejectModule);
app.delete('/api/modules/:id', protect, moduleController.deleteModule);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'story-service' });
});

app.use(errorHandler);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Story Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Story Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
