import { Request, Response } from 'express';
import { Risk } from '../models/riskModel';
import { auditLogger } from '../utils/audit.logger';

export const getRisks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const risks = await Risk.find({ projectId }).populate('ownerId', 'employeeName email').lean();
    res.json({ success: true, data: risks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRisk = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;
    const risk = new Risk({
      ...req.body,
      projectId,
      createdBy: user.id
    });
    await risk.save();

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'RISK',
      entityId: risk._id,
      entityName: risk.title,
      description: `Risk created: ${risk.title}`
    });

    res.status(201).json({ success: true, data: risk });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRisk = async (req: Request, res: Response) => {
  try {
    const { riskId } = req.params;
    const risk = await Risk.findByIdAndUpdate(
      riskId,
      { $set: req.body },
      { new: true }
    );
    if (!risk) {
      return res.status(404).json({ success: false, message: 'Risk not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'RISK',
      entityId: risk._id,
      entityName: risk.title,
      description: `Risk updated: ${risk.title}`
    });

    res.json({ success: true, data: risk });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRisk = async (req: Request, res: Response) => {
  try {
    const { riskId } = req.params;
    const risk = await Risk.findByIdAndDelete(riskId);
    if (!risk) {
      return res.status(404).json({ success: false, message: 'Risk not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'RISK',
      entityId: riskId,
      entityName: risk.title,
      description: `Risk deleted: ${risk.title}`
    });

    res.json({ success: true, message: 'Risk deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
