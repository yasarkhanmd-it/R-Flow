import { User } from '../models/userModel';
import { Project } from '../models/projectModel';
import { Department } from '../models/department.model';
import { Notification } from '../models/notificationModel';
import { Task } from '../models/taskModel';
import { Module } from '../models/moduleModel';
import { Milestone } from '../models/milestoneModel';
import { ActivityLog } from '../models/activityLogModel';
import { Comment } from '../models/commentModel';
import { Attachment } from '../models/attachmentModel';
import { Risk } from '../models/riskModel';
import { Issue } from '../models/issueModel';
import { ChangeRequest } from '../models/changeRequestModel';
import { Bom } from '../models/bomModel';
import { BomItem } from '../models/bomItemModel';
import { Transaction } from '../models/transactionModel';

export const createProject = async (data: any, creatorUserId: string) => {
  const assignedManagerId = data.managerId || creatorUserId;
  // Auto-assign departmentId from the manager's profile
  const manager = await User.findById(assignedManagerId).select('departmentId').lean();

  const membersList: string[] = [];
  if (data.leadId) {
    membersList.push(data.leadId);
  }

  const projectData: any = {
    name: data.name,
    description: data.description || '',
    projectCode: data.projectCode || null,
    startDate: data.startDate || null,
    expectedEndDate: data.expectedEndDate || null,
    budget: data.budget ? Number(data.budget) : 0,
    teamSize: data.teamSize ? Number(data.teamSize) : 0,
    hoursAllocated: data.hoursAllocated ? Number(data.hoursAllocated) : 0,
    hoursUsed: data.hoursUsed ? Number(data.hoursUsed) : 0,
    actualCost: data.actualCost ? Number(data.actualCost) : 0,
    committedCost: data.committedCost ? Number(data.committedCost) : 0,
    retentionHoldback: data.retentionHoldback ? Number(data.retentionHoldback) : 0,
    revenue: data.revenue ? Number(data.revenue) : 0,
    otherCashInflow: data.otherCashInflow ? Number(data.otherCashInflow) : 0,
    otherCashOutflow: data.otherCashOutflow ? Number(data.otherCashOutflow) : 0,
    verticalId: data.verticalId || null,
    departmentIds: Array.isArray(data.departmentIds) ? data.departmentIds : (data.departmentId ? [data.departmentId] : []),
    managerId: assignedManagerId,
    departmentId: (manager as any)?.departmentId || null,
    members: membersList
  };

  if (data.leadId) {
    projectData.leadId = data.leadId;
    projectData.status = 'Assigned';
    projectData.assignedDate = new Date();
  } else {
    projectData.status = 'Active';
  }

  const project = new Project(projectData);
  const savedProject = await project.save();

  if (data.leadId) {
    const notification = new Notification({
      type: 'NEW_PROJECT_ASSIGNED',
      fromUser: manager,
      toUser: data.leadId,
      project: savedProject._id
    });
    await notification.save();
  }

  return await Project.findById(savedProject._id)
    .populate('verticalId', 'name code')
    .populate({ path: 'managerId', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
    .populate({ path: 'leadId', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
    .populate({ path: 'members', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] });
};

export const getProjects = async (
  userId?: string,
  role?: string,
  _legacyDeptId?: string,
  superAdmin?: boolean
) => {
  const isAdminLevel = superAdmin || role === 'Administrator';

  // Build query based on role
  let query: any = {};

  if (!isAdminLevel && role === 'Manager' && userId) {
    // Managers see ONLY projects they created/manage, OR projects
    // linked to departments where they are assigned as a manager
    const managedDepts = await Department.find(
      { managerIds: userId },
      { _id: 1 }
    ).lean();
    const managedDeptIds = managedDepts.map(d => d._id);

    query = {
      $or: [
        { managerId: userId },
        { departmentIds: { $in: managedDeptIds } }
      ]
    };
  } else if (!isAdminLevel && role === 'Lead' && userId) {
    // Leads see projects they are assigned to
    query = { leadId: userId };
  } else if (!isAdminLevel && role === 'User' && userId) {
    // Regular users see projects they are members of
    query = { members: userId };
  }
  // Admins/SuperAdmins: query stays {} (see all)

  return await Project.find(query)
    .populate('verticalId', 'name code')
    .populate({ path: 'departmentIds', select: 'departmentName verticalId', populate: { path: 'verticalId', select: 'name code' } })
    .populate({ path: 'managerId', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
    .populate({ path: 'leadId', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
    .populate({ path: 'members', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
    .sort({ createdAt: -1 });
};


export const deleteProject = async (projectId: string) => {
  const project = await Project.findByIdAndDelete(projectId);
  if (project) {
    const modules = await Module.find({ projectId });
    const moduleIds = modules.map(m => m._id);

    const tasks = await Task.find({ projectId });
    const taskIds = tasks.map(t => t._id);

    await Comment.deleteMany({
      $or: [
        { targetType: 'Module', targetId: { $in: moduleIds } },
        { targetType: 'Task', targetId: { $in: taskIds } }
      ]
    });

    await Attachment.deleteMany({
      $or: [
        { targetType: 'Module', targetId: { $in: moduleIds } },
        { targetType: 'Task', targetId: { $in: taskIds } }
      ]
    });

    await ActivityLog.deleteMany({
      $or: [
        { targetType: 'Project', targetId: projectId },
        { targetType: 'Module', targetId: { $in: moduleIds } },
        { targetType: 'Task', targetId: { $in: taskIds } }
      ]
    });

    await Notification.deleteMany({
      $or: [
        { project: projectId },
        { task: { $in: taskIds } }
      ]
    });

    await Task.deleteMany({ projectId });
    await Module.deleteMany({ projectId });
  }
  return project;
};

export const updateProject = async (projectId: string, updateData: any, managerId: string, isAdmin: boolean = false) => {
  const existing = await Project.findById(projectId);
  if (!existing) {
    throw new Error('Project not found');
  }
  if (!isAdmin && existing.managerId.toString() !== managerId) {
    throw new Error('Unauthorized');
  }

  const oldLeadId = existing.leadId?.toString();
  const newLeadId = updateData.leadId;

  if (newLeadId && newLeadId !== oldLeadId) {
    updateData.status = 'Assigned';
    updateData.assignedDate = new Date();
    updateData.rejectionReason = '';
  }

  const updated = await Project.findByIdAndUpdate(projectId, updateData, { new: true })
    .populate('verticalId', 'name code')
    .populate({ path: 'managerId', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
    .populate({ path: 'leadId', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
    .populate({ path: 'members', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] });

  if (updated && newLeadId && newLeadId !== oldLeadId) {
    const notification = new Notification({
      type: 'NEW_PROJECT_ASSIGNED',
      fromUser: managerId,
      toUser: newLeadId,
      project: updated._id
    });
    await notification.save();
  } else if (updated && newLeadId && newLeadId === oldLeadId) {
    const notification = new Notification({
      type: 'PROJECT_UPDATED',
      fromUser: managerId,
      toUser: newLeadId,
      project: updated._id
    });
    await notification.save();
  }

  return updated;
};

export const acceptProject = async (projectId: string, leadId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  if (project.leadId?.toString() !== leadId.toString()) {
    throw new Error('Only the assigned Team Lead can accept this project');
  }

  project.status = 'Accepted';
  if (!project.members.includes(leadId as any)) {
    project.members.push(leadId as any);
  }
  await project.save();

  const notification = new Notification({
    type: 'PROJECT_ACCEPTED',
    fromUser: leadId,
    toUser: project.managerId,
    project: project._id
  });
  await notification.save();

  return project;
};

export const rejectProject = async (projectId: string, leadId: string, reason: string) => {
  if (!reason?.trim()) {
    throw new Error('Rejection reason is required');
  }
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  if (project.leadId?.toString() !== leadId.toString()) {
    throw new Error('Only the assigned Team Lead can reject this project');
  }

  project.status = 'Rejected';
  project.rejectionReason = reason;
  await project.save();

  const notification = new Notification({
    type: 'PROJECT_REJECTED',
    fromUser: leadId,
    toUser: project.managerId,
    project: project._id,
    message: reason
  });
  await notification.save();

  return project;
};

export const requestJoinProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  if (project.members.includes(userId as any)) {
    throw new Error('Already a member of this project');
  }

  const existingReq = await Notification.findOne({
    type: 'PROJECT_JOIN_REQUEST',
    fromUser: userId,
    project: projectId,
    status: 'PENDING'
  });

  if (existingReq) {
    throw new Error('Join request already pending');
  }

  const notification = new Notification({
    type: 'PROJECT_JOIN_REQUEST',
    fromUser: userId,
    toUser: project.managerId,
    project: projectId
  });

  return await notification.save();
};

export const leaveProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  if (project.managerId.toString() === userId) {
    throw new Error('Manager cannot leave the project');
  }
  if (project.leadId?.toString() === userId) {
    throw new Error('Team Lead cannot leave the project (must be reassigned)');
  }

  const updated = await Project.findByIdAndUpdate(projectId, {
    $pull: { members: userId }
  }, { new: true });

  return updated;
};

export const removeMember = async (projectId: string, managerId: string, memberId: string, isAdmin: boolean = false) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  if (!isAdmin && project.managerId.toString() !== managerId) {
    throw new Error('Only the manager or administrator can remove members');
  }

  if (project.leadId?.toString() === memberId) {
    throw new Error('Cannot remove the Team Lead. Reassign the lead first.');
  }

  const updated = await Project.findByIdAndUpdate(projectId, {
    $pull: { members: memberId }
  }, { new: true });

  return updated;
};

export const addMemberToProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  const updated = await Project.findByIdAndUpdate(
    projectId,
    { $addToSet: { members: userId } },
    { new: true }
  )
  .populate({ path: 'managerId', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
  .populate({ path: 'leadId', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] })
  .populate({ path: 'members', select: 'employeeName email department departmentId verticalId role employeeId', populate: [{ path: 'departmentId' }, { path: 'verticalId' }] });

  return updated;
};

// ─────────────────────────────────────────────────────────────────────────────
// Project Overview — enriched data for the Overview tab
// ─────────────────────────────────────────────────────────────────────────────
export const getProjectOverview = async (projectId: string) => {
  const project = await Project.findById(projectId)
    .populate('managerId', 'employeeName employeeId')
    .populate('leadId', 'employeeName employeeId')
    .populate('members', 'employeeName employeeId')
    .populate('verticalId', 'name')
    .populate('departmentIds', 'departmentName departmentCode')
    .lean();

  if (!project) {
    throw new Error('Project not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch task stats directly (project-service shares the same MongoDB as task-service)
  const tasks = await Task.find({ projectId }).select('status dueDate').lean();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Done' && t.status !== 'Completed').length;
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    if (t.status === 'Done' || t.status === 'Completed') return false;
    return new Date(t.dueDate) < today;
  }).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Module count
  const moduleCount = await Module.countDocuments({ projectId });

  // Milestone stats
  const milestones = await Milestone.find({ projectId }).lean();
  const milestoneStats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'Completed').length,
    inProgress: milestones.filter(m => m.status === 'In Progress').length,
    delayed: milestones.filter(m => m.status === 'Delayed').length,
    notStarted: milestones.filter(m => m.status === 'Not Started').length
  };
  // BOM Stats
  const boms = await Bom.find({ projectId }).select('_id currentRevisionId').lean();
  const totalBoms = boms.length;
  let totalBomEstimatedCost = 0;
  
  if (totalBoms > 0) {
    const activeRevisionIds = boms.map(b => b.currentRevisionId).filter(id => id);
    if (activeRevisionIds.length > 0) {
      const items = await BomItem.find({ revisionId: { $in: activeRevisionIds } }).select('totalCost').lean();
      totalBomEstimatedCost = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    }
  }

  return {
    project,
    taskStats: {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      progressPercentage
    },
    moduleCount,
    milestoneCount: milestoneStats.total,
    milestoneStats,
    openRisksCount: await Risk.countDocuments({ projectId, status: { $nin: ['Closed', 'Mitigated'] } }),
    openIssuesCount: await Issue.countDocuments({ projectId, status: 'Open' }),
    criticalIssuesCount: await Issue.countDocuments({ projectId, priority: 'Critical', status: { $ne: 'Closed' } }),
    pendingChangeRequestsCount: await ChangeRequest.countDocuments({ projectId, approvalStatus: 'Pending', status: { $ne: 'Closed' } }),
    approvedChangeRequestsCount: await ChangeRequest.countDocuments({ projectId, approvalStatus: 'Approved', status: { $ne: 'Closed' } }),
    bomStats: {
      totalBoms,
      totalBomEstimatedCost
    },
    financialStats: {
      budget: project.budget || 0,
      actualCost: await Transaction.aggregate([
        { $match: { projectId: project._id, type: 'Outflow', status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(res => res[0]?.total || 0),
      committedCost: await Transaction.aggregate([
        { $match: { projectId: project._id, type: 'Outflow', status: { $in: ['Planned', 'Pending'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(res => res[0]?.total || 0),
      realizedRevenue: await Transaction.aggregate([
        { $match: { projectId: project._id, type: 'Inflow', status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(res => res[0]?.total || 0),
    }
  };
};
