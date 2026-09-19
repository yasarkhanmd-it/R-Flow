import { Request, Response } from 'express';
import * as pdService from '../services/projectDepartment.service';

const getUser = (req: Request) => (req as any).user;
const isAdminLevel = (user: any) => user?.superAdmin === true || user?.role === 'Administrator';
const isManagerOrAdmin = (user: any) => user?.role === 'Manager' || isAdminLevel(user);

// ── GET /api/projects/:id/departments ─────────────────────────────────────────
export const getProjectDepartments = async (req: Request, res: Response) => {
  try {
    const data = await pdService.getProjectDepartments(req.params.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── POST /api/projects/:id/departments ───────────────────────────────────────
export const addDepartmentToProject = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!isManagerOrAdmin(user)) {
      return res.status(403).json({ success: false, message: 'Manager authorization required.' });
    }
    const { departmentId } = req.body;
    if (!departmentId) {
      return res.status(400).json({ success: false, message: 'departmentId is required.' });
    }
    const data = await pdService.addDepartmentToProject(req.params.id, departmentId);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/projects/:id/departments/:deptId ──────────────────────────────
export const removeDepartmentFromProject = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    if (!isManagerOrAdmin(user)) {
      return res.status(403).json({ success: false, message: 'Manager authorization required.' });
    }
    await pdService.removeDepartmentFromProject(req.params.id, req.params.deptId);
    res.json({ success: true, message: 'Department removed from project.' });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
