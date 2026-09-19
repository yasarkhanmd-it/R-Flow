import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getDashboardData, getPortfolioData } from './controllers/dashboard.controller';
import { protect } from '../../../common/middleware/auth.middleware';
import { errorHandler } from '../../../common/middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5006;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rflow';

app.use(cors());
app.use(express.json());

// Dashboard Route
app.get('/api/dashboard', protect, getDashboardData);
app.get('/api/dashboard/portfolio', protect, getPortfolioData);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'dashboard-service' });
});

app.use(errorHandler);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Dashboard Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Dashboard Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
