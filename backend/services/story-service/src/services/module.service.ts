import mongoose from 'mongoose';
import { Module } from '../models/moduleModel';
import { Notification } from '../models/notificationModel';
import { User } from '../models/userModel';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { Comment } from '../models/commentModel';
import { Attachment } from '../models/attachmentModel';
import { ActivityLog } from '../models/activityLogModel';

export const createModule = async (projectId: string, name: string, description: string, createdBy: string, dueDate?: Date) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const existing = await Module.findOne({ projectId, name: new RegExp(`^${name}$`, 'i') });
  if (existing) {
    throw new Error('This module already exists in this project.');
  }

  const moduleData: any = {
    projectId,
    name,
    description,
    createdBy,
    status: 'Pending Approval'
  };
  
  if (dueDate) {
    moduleData.dueDate = dueDate;
  }

  const module = new Module(moduleData);
  const saved = await module.save();

  const notifyId = project.leadId || project.managerId;
  if (notifyId) {
    const notification = new Notification({
      type: 'MODULE_CREATED',
      fromUser: createdBy,
      toUser: notifyId,
      project: projectId,
      message: `Module "${name}" requires approval`
    });
    await notification.save();
  }

  return saved;
};

export const getModules = async (projectId: string) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return [];
  }
  return await Module.find({ projectId })
    .populate('createdBy', 'employeeName')
    .sort({ createdAt: -1 });
};

export const getAllModules = async () => {
  return await Module.find({})
    .populate('projectId', 'name')
    .populate('createdBy', 'employeeName')
    .sort({ createdAt: -1 });
};

export const getModuleById = async (moduleId: string) => {
  if (!mongoose.Types.ObjectId.isValid(moduleId)) {
    return null;
  }
  return await Module.findById(moduleId)
    .populate('createdBy', 'employeeName')
    .populate('projectId', 'name');
};

export const updateModule = async (moduleId: string, updateData: any) => {
  const updated = await Module.findByIdAndUpdate(moduleId, updateData, { new: true })
    .populate('createdBy', 'employeeName');
  if (!updated) throw new Error('Module not found');
  return updated;
};

export const deleteModule = async (moduleId: string) => {
  const deleted = await Module.findByIdAndDelete(moduleId);
  if (deleted) {
    const tasks = await Task.find({ moduleId });
    const taskIds = tasks.map(t => t._id);

    await Comment.deleteMany({
      $or: [
        { targetType: 'Module', targetId: moduleId },
        { targetType: 'Task', targetId: { $in: taskIds } }
      ]
    });

    await Attachment.deleteMany({
      $or: [
        { targetType: 'Module', targetId: moduleId },
        { targetType: 'Task', targetId: { $in: taskIds } }
      ]
    });

    await ActivityLog.deleteMany({
      $or: [
        { targetType: 'Module', targetId: moduleId },
        { targetType: 'Task', targetId: { $in: taskIds } }
      ]
    });

    await Notification.deleteMany({
      task: { $in: taskIds }
    });

    await Task.deleteMany({ moduleId });
  }
  return deleted;
};

export const approveModule = async (moduleId: string, approverId: string) => {
  const module = await Module.findById(moduleId);
  if (!module) throw new Error('Module not found');

  module.status = 'Approved';
  module.rejectionReason = '';
  await module.save();

  const notification = new Notification({
    type: 'MODULE_APPROVED',
    fromUser: approverId,
    toUser: module.createdBy,
    project: module.projectId,
    message: `Module "${module.name}" was approved`
  });
  await notification.save();

  return module;
};

export const rejectModule = async (moduleId: string, rejectorId: string, reason: string) => {
  if (!reason?.trim()) throw new Error('Rejection reason is required');

  const module = await Module.findById(moduleId);
  if (!module) throw new Error('Module not found');

  module.status = 'Rejected';
  module.rejectionReason = reason;
  await module.save();

  const notification = new Notification({
    type: 'MODULE_REJECTED',
    fromUser: rejectorId,
    toUser: module.createdBy,
    project: module.projectId,
    message: `Module "${module.name}" was rejected. Reason: ${reason}`
  });
  await notification.save();

  return module;
};
