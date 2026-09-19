import { ActivityLog } from '../models/activityLogModel';

export const logActivity = async (targetType: 'Module' | 'Task' | 'Project', targetId: string, action: string, details: string, performedBy: string) => {
  const activity = new ActivityLog({
    targetType,
    targetId,
    action,
    details,
    performedBy
  });
  return await activity.save();
};

export const getActivities = async (targetType: 'Module' | 'Task' | 'Project', targetId: string) => {
  return await ActivityLog.find({ targetType, targetId })
    .populate('performedBy', 'employeeName')
    .sort({ createdAt: -1 });
};
