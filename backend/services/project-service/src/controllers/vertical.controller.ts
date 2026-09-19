import { Request, Response } from 'express';
import * as verticalService from '../services/vertical.service';
import { auditLogger } from '../utils/audit.logger';

const getUser = (req: Request) => (req as any).user;
const isAdminLevel = (user: any) => user?.superAdmin === true || user?.role === 'Administrator';

// ── POST /api/verticals ───────────────────────────────────────────────────────
export const createVertical = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const createdBy = user?._id || user?.id || 'system';
    const vertical = await verticalService.createVertical(req.body, createdBy);

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: createdBy,
      actorName: user?.employeeName || 'Unknown',
      actorRole: user?.role || 'User',
      action: 'CREATED',
      entityType: 'VERTICAL',
      entityId: vertical._id,
      entityName: vertical.name,
      description: `Vertical created: ${vertical.name}`
    });

    res.status(201).json({ success: true, data: vertical });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── GET /api/verticals ────────────────────────────────────────────────────────
export const getVerticals = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const verticals = await verticalService.getVerticals({
      id: user?.id || user?._id,
      role: user?.role,
      superAdmin: user?.superAdmin
    });
    res.json({ success: true, data: verticals });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── GET /api/verticals/:id ────────────────────────────────────────────────────
export const getVerticalById = async (req: Request, res: Response) => {
  try {
    const vertical = await verticalService.getVerticalById(req.params.id);
    res.json({ success: true, data: vertical });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── GET /api/verticals/:id/departments ────────────────────────────────────────
export const getVerticalDepartments = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const departments = await verticalService.getVerticalDepartments(req.params.id, {
      id: user?.id || user?._id,
      role: user?.role,
      superAdmin: user?.superAdmin
    });
    res.json({ success: true, data: departments });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/verticals/:id ────────────────────────────────────────────────────
export const updateVertical = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const actorId = user?._id || user?.id || 'system';

    const vertical = await verticalService.updateVertical(req.params.id, req.body);
    if (!vertical) return res.status(404).json({ success: false, message: 'Vertical not found' });
    
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: actorId,
      actorName: user?.employeeName || 'Unknown',
      actorRole: user?.role || 'User',
      action: 'UPDATED',
      entityType: 'VERTICAL',
      entityId: vertical._id.toString(),
      entityName: vertical.name,
      description: `Vertical updated: ${vertical.name}`
    });

    res.json({ success: true, data: vertical });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/verticals/:id ─────────────────────────────────────────────────
export const deleteVertical = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const actorId = user?._id || user?.id || 'system';

    await verticalService.deleteVertical(req.params.id);
    
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: actorId,
      actorName: user?.employeeName || 'Unknown',
      actorRole: user?.role || 'User',
      action: 'DELETED',
      entityType: 'VERTICAL',
      entityId: req.params.id,
      entityName: 'Vertical',
      description: `Vertical deleted`
    });

    res.json({ success: true, message: 'Vertical deleted successfully.' });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
