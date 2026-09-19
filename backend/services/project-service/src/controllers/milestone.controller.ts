import { Request, Response } from 'express';
import * as milestoneService from '../services/milestone.service';
import { auditLogger } from '../utils/audit.logger';

export const getMilestones = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const milestones = await milestoneService.getMilestonesByProject(projectId);
    res.json({ success: true, data: milestones });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMilestoneById = async (req: Request, res: Response) => {
  try {
    const milestoneId = req.params.mid;
    const milestone = await milestoneService.getMilestoneById(milestoneId);
    res.json({ success: true, data: milestone });
  } catch (error: any) {
    const status = error.message === 'Milestone not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const createMilestone = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const user = (req as any).user;
    const userId = user?._id || user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const milestone = await milestoneService.createMilestone(projectId, req.body, userId);

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'MILESTONE',
      entityId: milestone._id,
      entityName: milestone.title,
      description: `Milestone created: ${milestone.title}`
    });

    res.status(201).json({ success: true, data: milestone });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMilestone = async (req: Request, res: Response) => {
  try {
    const milestoneId = req.params.mid;
    const user = (req as any).user;
    const userId = user?._id || user?.id;
    const role = user?.role;
    const superAdmin = user?.superAdmin;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const milestone = await milestoneService.updateMilestone(
      milestoneId,
      req.body,
      userId,
      role,
      superAdmin
    );

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'MILESTONE',
      entityId: milestone._id,
      entityName: milestone.title,
      description: `Milestone updated: ${milestone.title}`
    });

    res.json({ success: true, data: milestone });
  } catch (error: any) {
    const status = error.message?.includes('Not authorized') ? 403 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deleteMilestone = async (req: Request, res: Response) => {
  try {
    const milestoneId = req.params.mid;
    const user = (req as any).user;
    const userId = user?._id || user?.id;
    const role = user?.role;
    const superAdmin = user?.superAdmin;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const result = await milestoneService.deleteMilestone(
      milestoneId,
      userId,
      role,
      superAdmin
    );

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'MILESTONE',
      entityId: milestoneId,
      entityName: 'Unknown Milestone',
      description: `Milestone was deleted`
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message?.includes('Not authorized') ? 403 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
