import { Request, Response } from 'express';
import * as activityLogService from '../services/activityLog.service';

interface AuthRequest extends Request {
  user?: any;
}

export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const activities = await activityLogService.getActivities(targetType as any, targetId);
    res.status(200).json({ success: true, data: activities });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
