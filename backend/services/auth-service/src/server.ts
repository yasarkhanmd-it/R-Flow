import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as authController from './controllers/auth.controller';
import * as userController from './controllers/user.controller';
import * as departmentController from './controllers/department.controller';
import * as passwordResetController from './controllers/password-reset.controller';
import { protect } from '../../../common/middleware/auth.middleware';
import { errorHandler } from '../../../common/middleware/error.middleware';

import { seedDatabase } from './seed/seeder';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rflow';

app.use(cors());
app.use(express.json());

// ── Auth Routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', protect, authController.profile);

// ── Password Reset Routes (public – no auth required) ─────────────────────────
app.post('/api/auth/forgot-password', passwordResetController.forgotPassword);
app.post('/api/auth/verify-otp', passwordResetController.verifyOtp);
app.post('/api/auth/reset-password', passwordResetController.resetPassword);

// ── User Routes ───────────────────────────────────────────────────────────────
// IMPORTANT: /api/users/all must be registered BEFORE /api/users/:id routes
app.get('/api/users/all', protect, userController.getAllUsers);
app.get('/api/users', protect, userController.getUsers);
app.put('/api/users/:id/department', protect, userController.assignUserDepartment);
app.put('/api/users/:id/role', protect, userController.updateUserRole);

// ── Dept stub (auth-service internal) ────────────────────────────────────────
app.get('/api/departments', departmentController.getDepartments);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

app.use(errorHandler);

// ── Database Connection & Server Listen ───────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Auth Service connected to MongoDB');
    await seedDatabase();
    // ensureAdminAccount is removed as per requirements
    app.listen(PORT, () => {
      console.log(`Auth Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
