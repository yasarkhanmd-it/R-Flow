import { Notification } from '../models/notificationModel';
import { Project } from '../models/projectModel';

export const getNotificationsForUser = async (userId: string, role?: string) => {
  let query: any = { toUser: userId };

  if (role === 'Lead') {
    const leadProjects = await Project.find({ leadId: userId });
    const leadProjIds = leadProjects.map(p => p._id);
    query = {
      $or: [
        { toUser: userId },
        { type: 'PROJECT_JOIN_REQUEST', project: { $in: leadProjIds } }
      ]
    };
  } else if (role === 'Manager') {
    const managedProjects = await Project.find({ managerId: userId });
    const managedProjIds = managedProjects.map(p => p._id);
    query = {
      $or: [
        { toUser: userId },
        { type: 'PROJECT_JOIN_REQUEST', project: { $in: managedProjIds } }
      ]
    };
  }

  return await Notification.find(query)
    .populate('fromUser', 'employeeName')
    .populate('project', 'name')
    .sort({ createdAt: -1 });
};

export const approveJoinRequest = async (notificationId: string, userId: string, role: string) => {
  const notification = await Notification.findById(notificationId).populate('project');
  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.status !== 'PENDING') {
    throw new Error('Request is already processed');
  }

  const project = notification.project as any;
  if (!project) {
    throw new Error('Project not found for this request');
  }

  const isManager = project.managerId.toString() === userId.toString();
  const isLead = project.leadId && project.leadId.toString() === userId.toString();

  if (!isManager && !isLead) {
    throw new Error('Unauthorized to approve this request');
  }

  notification.status = 'APPROVED';
  notification.read = true;
  await notification.save();

  await Project.findByIdAndUpdate(project._id, {
    $addToSet: { members: notification.fromUser }
  });

  return notification;
};

export const rejectJoinRequest = async (notificationId: string, userId: string, role: string) => {
  const notification = await Notification.findById(notificationId).populate('project');
  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.status !== 'PENDING') {
    throw new Error('Request is already processed');
  }

  const project = notification.project as any;
  if (!project) {
    throw new Error('Project not found for this request');
  }

  const isManager = project.managerId.toString() === userId.toString();
  const isLead = project.leadId && project.leadId.toString() === userId.toString();

  if (!isManager && !isLead) {
    throw new Error('Unauthorized to reject this request');
  }

  notification.status = 'REJECTED';
  notification.read = true;
  await notification.save();

  return notification;
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, toUser: userId },
    { read: true },
    { new: true }
  );
  if (!notification) throw new Error('Notification not found');
  return notification;
};

export const markAllAsRead = async (userId: string) => {
  await Notification.updateMany({ toUser: userId, read: false }, { read: true });
  return { success: true };
};

export const getUnreadCount = async (userId: string, role?: string) => {
  let query: any = { toUser: userId, read: false };

  if (role === 'Lead') {
    const leadProjects = await Project.find({ leadId: userId });
    const leadProjIds = leadProjects.map(p => p._id);
    query = {
      $or: [
        { toUser: userId, read: false },
        { type: 'PROJECT_JOIN_REQUEST', project: { $in: leadProjIds }, read: false }
      ]
    };
  } else if (role === 'Manager') {
    const managedProjects = await Project.find({ managerId: userId });
    const managedProjIds = managedProjects.map(p => p._id);
    query = {
      $or: [
        { toUser: userId, read: false },
        { type: 'PROJECT_JOIN_REQUEST', project: { $in: managedProjIds }, read: false }
      ]
    };
  }

  return await Notification.countDocuments(query);
};

import { ActivityLog } from '../models/activityLogModel';

export const getAuditLogs = async (limit: number = 50) => {
  const logs = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
    
  return logs.map(log => ({
    ...log,
    performedBy: {
      _id: log.actorUserId,
      employeeName: log.actorName
    }
  }));
};

export const createAuditLog = async (data: any) => {
  const log = new ActivityLog(data);
  await log.save();
  return log;
};

