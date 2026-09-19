import { Request, Response } from 'express';
import * as deptService from '../services/department.service';
import { auditLogger } from '../utils/audit.logger';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getUser = (req: Request) => (req as any).user;

const isAdminLevel = (user: any) =>
  user?.superAdmin === true || user?.role === 'Administrator';

const isManagerOrAdmin = (user: any) =>
  user?.role === 'Manager' || isAdminLevel(user);


// ── POST /api/departments ─────────────────────────────────────────────────────
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const actorId = user?._id || user?.id || 'system';

    const dept = await deptService.createDepartment(req.body, actorId);

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: actorId,
      actorName: user?.employeeName || 'Unknown',
      actorRole: user?.role || 'User',
      action: 'CREATED',
      entityType: 'DEPARTMENT',
      entityId: dept._id,
      entityName: dept.departmentName,
      description: `Department created: ${dept.departmentName}`
    });

    res.status(201).json({ success: true, data: dept });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── GET /api/departments ──────────────────────────────────────────────────────
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const departments = await deptService.getDepartments({
      id: user?.id || user?._id,
      role: user?.role,
      superAdmin: user?.superAdmin
    });
    res.json({ success: true, data: departments });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── GET /api/departments/:id ──────────────────────────────────────────────────
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const dept = await deptService.getDepartmentById(req.params.id);
    res.json({ success: true, data: dept });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/departments/:id ──────────────────────────────────────────────────
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const actorId = user?._id || user?.id || 'system';

    const dept = await deptService.updateDepartment(req.params.id, req.body);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: actorId,
      actorName: user?.employeeName || 'Unknown',
      actorRole: user?.role || 'User',
      action: 'UPDATED',
      entityType: 'DEPARTMENT',
      entityId: dept._id.toString(),
      entityName: dept.departmentName,
      description: `Department updated: ${dept.departmentName}`
    });

    res.json({ success: true, data: dept });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/departments/:id ───────────────────────────────────────────────
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const actorId = user?._id || user?.id || 'system';

    await deptService.deleteDepartment(req.params.id);
    
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: actorId,
      actorName: user?.employeeName || 'Unknown',
      actorRole: user?.role || 'User',
      action: 'DELETED',
      entityType: 'DEPARTMENT',
      entityId: req.params.id,
      entityName: 'Department',
      description: `Department deleted`
    });

    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── GET /api/departments/:id/projects ─────────────────────────────────────────
export const getDepartmentProjects = async (req: Request, res: Response) => {
  try {
    const projects = await deptService.getDepartmentProjects(req.params.id);
    res.json({ success: true, data: projects });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── GET /api/departments/:id/users ────────────────────────────────────────────
export const getDepartmentUsers = async (req: Request, res: Response) => {
  try {
    const users = await deptService.getDepartmentUsers(req.params.id);
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/departments/:id/managers ─────────────────────────────────────────
// Accepts { managerIds: string[] } — sets the managers for this department
export const assignManagers = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!isAdminLevel(user)) {
      return res.status(403).json({ success: false, message: 'Administrator authorization required.' });
    }

    const { managerIds } = req.body;
    if (!Array.isArray(managerIds)) {
      return res.status(400).json({ success: false, message: 'managerIds must be an array.' });
    }

    const dept = await deptService.assignManagers(req.params.id, managerIds);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'ASSIGNED_MANAGERS',
      entityType: 'DEPARTMENT',
      entityId: dept._id.toString(),
      entityName: dept.departmentName,
      description: `Managers assigned to department: ${dept.departmentName}`
    });

    res.json({ success: true, data: dept });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
