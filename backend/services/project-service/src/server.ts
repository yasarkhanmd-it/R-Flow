import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import * as projectController from './controllers/project.controller';
import * as departmentController from './controllers/department.controller';
import * as verticalController from './controllers/vertical.controller';
import * as projectDeptController from './controllers/projectDepartment.controller';
import * as milestoneController from './controllers/milestone.controller';
import * as ganttController from './controllers/gantt.controller';
import * as resourceController from './controllers/resource.controller';
import riskRoutes from './routes/risk.routes';
import issueRoutes from './routes/issue.routes';
import crRoutes from './routes/changeRequest.routes';
import bomRoutes from './routes/bom.routes';
import bomRevisionRoutes from './routes/bomRevision.routes';
import bomItemRoutes from './routes/bomItem.routes';
import transactionRoutes from './routes/transaction.routes';
import supplierRoutes from './routes/supplier.routes';
import poRoutes from './routes/po.routes';
import grnRoutes from './routes/grn.routes';
import { protect } from '../../../common/middleware/auth.middleware';
import { errorHandler } from '../../../common/middleware/error.middleware';

// Import models to register them with mongoose
import './models/verticalModel';
import './models/department.model';
import './models/projectDepartmentModel';
import './models/milestoneModel';
import './models/riskModel';
import './models/issueModel';
import './models/changeRequestModel';
import './models/supplierModel';
import './models/purchaseOrderModel';
import './models/grnModel';
import { Vertical } from './models/verticalModel';
import { Department } from './models/department.model';
import { Project } from './models/projectModel';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rflow';

app.use(cors());
app.use(express.json());

// ── Project Routes ────────────────────────────────────────────────────────────
app.get('/api/projects', protect, projectController.getProjects);
app.post('/api/projects', protect, projectController.createProject);
app.get('/api/projects/:id/overview', protect, projectController.getProjectOverview);
app.put('/api/projects/:id', protect, projectController.updateProject);
app.post('/api/projects/:id/accept', protect, projectController.acceptProject);
app.post('/api/projects/:id/reject', protect, projectController.rejectProject);
app.post('/api/projects/:id/request', protect, projectController.requestJoin);
app.post('/api/projects/:id/leave', protect, projectController.leaveProject);
app.post('/api/projects/:id/members', protect, projectController.addMember);
app.delete('/api/projects/:id/members/:memberId', protect, projectController.removeMember);
app.delete('/api/projects/:id', protect, projectController.deleteProject);


// ── Project-Department Routes ─────────────────────────────────────────────────
app.get('/api/projects/:id/departments', protect, projectDeptController.getProjectDepartments);
app.post('/api/projects/:id/departments', protect, projectDeptController.addDepartmentToProject);
app.delete('/api/projects/:id/departments/:deptId', protect, projectDeptController.removeDepartmentFromProject);

// ── Milestone Routes ──────────────────────────────────────────────────────────
app.get('/api/projects/:id/milestones', protect, milestoneController.getMilestones);
app.get('/api/projects/:id/milestones/:mid', protect, milestoneController.getMilestoneById);
app.post('/api/projects/:id/milestones', protect, milestoneController.createMilestone);
app.put('/api/projects/:id/milestones/:mid', protect, milestoneController.updateMilestone);
app.delete('/api/projects/:id/milestones/:mid', protect, milestoneController.deleteMilestone);

// ── Timeline / Gantt Routes ───────────────────────────────────────────────────
app.get('/api/projects/:id/gantt', protect, ganttController.getGanttData);

// ── Resource Allocation & Utilization Routes ─────────────────────────────────
app.get('/api/projects/:projectId/resources', protect, resourceController.getProjectResources);
app.post('/api/projects/:projectId/resources', protect, resourceController.addOrUpdateResourceAllocation);
app.delete('/api/projects/:projectId/resources/:allocationId', protect, resourceController.deleteResourceAllocation);
app.get('/api/projects/:projectId/resource-utilization', protect, resourceController.getProjectResourceUtilization);

// ── Risk Routes ───────────────────────────────────────────────────────────────// ⚡ Risk Routes ⚡
app.use('/api/projects/:projectId/risks', riskRoutes);

// 🛠 Issue & Change Request Routes 🛠
app.use('/api/projects/:projectId/issues', issueRoutes);
app.use('/api/projects/:projectId/change-requests', crRoutes);

// 📦 BOM Routes 📦
app.use('/api/projects/:projectId/boms', bomRoutes);
app.use('/api/projects/:projectId/bom-revisions', bomRevisionRoutes);
app.use('/api/projects/:projectId/bom-items', bomItemRoutes);
app.use('/api/projects/:projectId/transactions', transactionRoutes);

// 🛒 Procurement Routes 🛒
app.use('/api/suppliers', supplierRoutes);
app.use('/api/projects/:projectId/pos', poRoutes);
app.use('/api/projects/:projectId/pos/:poId/receipts', grnRoutes);

// ── Vertical Routes ───────────────────────────────────────────────────────────
app.post('/api/verticals', protect, verticalController.createVertical);
app.get('/api/verticals', protect, verticalController.getVerticals);
app.get('/api/verticals/:id', protect, verticalController.getVerticalById);
app.get('/api/verticals/:id/departments', protect, verticalController.getVerticalDepartments);
app.put('/api/verticals/:id', protect, verticalController.updateVertical);
app.delete('/api/verticals/:id', protect, verticalController.deleteVertical);

// ── Department Routes ─────────────────────────────────────────────────────────
app.post('/api/departments', protect, departmentController.createDepartment);
app.get('/api/departments', protect, departmentController.getDepartments);
app.get('/api/departments/:id', protect, departmentController.getDepartmentById);
app.put('/api/departments/:id/managers', protect, departmentController.assignManagers);
app.get('/api/departments/:id/projects', protect, departmentController.getDepartmentProjects);
app.get('/api/departments/:id/users', protect, departmentController.getDepartmentUsers);
app.put('/api/departments/:id', protect, departmentController.updateDepartment);
app.delete('/api/departments/:id', protect, departmentController.deleteDepartment);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'project-service' });
});

app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// Startup Data Migration (idempotent)
// ─────────────────────────────────────────────────────────────────────────────
async function runMigration() {
  try {
    console.log('[Migration] Starting organizational structure migration...');

    // 1. Create default "General" Vertical if it doesn't exist
    let defaultVertical = await Vertical.findOne({ name: 'General' });
    if (!defaultVertical) {
      defaultVertical = await Vertical.create({
        name: 'General',
        description: 'Default vertical for migrated departments',
        status: 'Active'
      });
      console.log('[Migration] Created default "General" vertical.');
    }

    // 2. Migrate departments: assign to "General" vertical if missing verticalId
    const deptsWithoutVertical = await Department.find({ verticalId: { $exists: false } });
    if (deptsWithoutVertical.length > 0) {
      await Department.updateMany(
        { verticalId: { $exists: false } },
        { $set: { verticalId: defaultVertical._id } }
      );
      console.log(`[Migration] Assigned ${deptsWithoutVertical.length} department(s) to "General" vertical.`);
    }

    // Also migrate departments with null verticalId
    const deptsWithNullVertical = await Department.find({ verticalId: null });
    if (deptsWithNullVertical.length > 0) {
      await Department.updateMany(
        { verticalId: null },
        { $set: { verticalId: defaultVertical._id } }
      );
      console.log(`[Migration] Assigned ${deptsWithNullVertical.length} department(s) with null verticalId to "General" vertical.`);
    }

    // 3. Migrate departments: managerId (single) → managerIds (array)
    const deptsWithSingleManager = await Department.find({
      managerId: { $exists: true, $ne: null },
      $or: [
        { managerIds: { $exists: false } },
        { managerIds: { $size: 0 } }
      ]
    } as any);
    if (deptsWithSingleManager.length > 0) {
      for (const dept of deptsWithSingleManager) {
        const legacyManagerId = (dept as any).managerId;
        if (legacyManagerId) {
          await Department.findByIdAndUpdate(dept._id, {
            $addToSet: { managerIds: legacyManagerId },
            $unset: { managerId: '' }
          });
        }
      }
      console.log(`[Migration] Migrated ${deptsWithSingleManager.length} department(s) from managerId to managerIds[].`);
    }

    // 4. Migrate projects: departmentId (single) → departmentIds (array)
    const projectsWithLegacyDept = await Project.find({
      departmentId: { $exists: true, $ne: null },
      $or: [
        { departmentIds: { $exists: false } },
        { departmentIds: { $size: 0 } }
      ]
    } as any);
    if (projectsWithLegacyDept.length > 0) {
      for (const proj of projectsWithLegacyDept) {
        const legacyDeptId = (proj as any).departmentId;
        if (legacyDeptId) {
          await Project.findByIdAndUpdate(proj._id, {
            $addToSet: { departmentIds: legacyDeptId }
          });
        }
      }
      console.log(`[Migration] Migrated ${projectsWithLegacyDept.length} project(s) from departmentId to departmentIds[].`);
    }

    console.log('[Migration] Migration complete.');
  } catch (err) {
    console.error('[Migration] Migration error (non-fatal):', err);
  }
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Project Service connected to MongoDB');
    await runMigration();
    app.listen(PORT, () => {
      console.log(`Project Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });
