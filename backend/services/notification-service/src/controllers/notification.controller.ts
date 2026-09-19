import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user._id || user.id;
    const role = user.role;
    const notifications = await notificationService.getNotificationsForUser(userId, role);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveRequest = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const user = (req as any).user;
    const userId = user._id || user.id;
    const role = user.role;

    if (role !== 'Manager' && role !== 'Lead') {
      return res.status(403).json({ success: false, message: 'Only managers and team leads can approve requests' });
    }

    const notification = await notificationService.approveJoinRequest(notificationId, userId, role);
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const user = (req as any).user;
    const userId = user._id || user.id;
    const role = user.role;

    if (role !== 'Manager' && role !== 'Lead') {
      return res.status(403).json({ success: false, message: 'Only managers and team leads can reject requests' });
    }

    const notification = await notificationService.rejectJoinRequest(notificationId, userId, role);
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const user = (req as any).user;
    const userId = user._id || user.id;

    const notification = await notificationService.markAsRead(notificationId, userId);
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user._id || user.id;

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user._id || user.id;
    const role = user.role;

    const count = await notificationService.getUnreadCount(userId, role);
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const role = user.role;
    
    // Only Managers, Leads, and Super Admins (Unit Head) can view audit logs
    if (role === 'User' || role === 'Employee') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view audit logs' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await notificationService.getAuditLogs(limit);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    // Basic verification that a trusted internal user/service is logging this.
    // The protect middleware ensures a valid JWT.
    
    if (!req.body.actorUserId || !req.body.action || !req.body.entityType || !req.body.entityId || !req.body.entityName) {
      return res.status(400).json({ success: false, message: 'Missing required audit fields' });
    }

    const log = await notificationService.createAuditLog(req.body);
    res.json({ success: true, data: log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
