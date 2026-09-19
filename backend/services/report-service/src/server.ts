import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as reportController from './controllers/report.controller';
import { protect } from '../../../common/middleware/auth.middleware';
import { errorHandler } from '../../../common/middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5007;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rflow';

app.use(cors());
app.use(express.json());

// ── Reports Routes ────────────────────────────────────────────────────────────
app.get('/api/reports/executive-summary', protect, reportController.getExecutiveSummaryReport);
app.get('/api/reports/project-performance', protect, reportController.getProjectPerformanceReport);
app.get('/api/reports/resource-utilization', protect, reportController.getResourceUtilizationReport);
app.get('/api/reports/financial-bom', protect, reportController.getFinancialBomReport);
app.get('/api/reports/risks-issues', protect, reportController.getRisksIssuesReport);
app.get('/api/reports/export', protect, reportController.exportReportCSV);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'report-service' });
});

app.use(errorHandler);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Report Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Report Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
