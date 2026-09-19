import { Milestone } from '../models/milestoneModel';
import { Project } from '../models/projectModel';

export const getMilestonesByProject = async (projectId: string) => {
  const milestones = await Milestone.find({ projectId })
    .populate('ownerId', 'employeeName email')
    .populate('createdBy', 'employeeName email')
    .sort({ plannedStart: 1, createdAt: 1 })
    .lean();

  return milestones;
};

export const getMilestoneById = async (milestoneId: string) => {
  const milestone = await Milestone.findById(milestoneId)
    .populate('ownerId', 'employeeName email')
    .populate('createdBy', 'employeeName email')
    .lean();

  if (!milestone) {
    throw new Error('Milestone not found');
  }

  return milestone;
};

export const createMilestone = async (projectId: string, data: any, userId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const { name, description, plannedStart, plannedEnd, actualEnd, ownerId, status, progress } = data;

  if (!name || !name.trim()) {
    throw new Error('Milestone name is required');
  }

  if (!plannedStart || !plannedEnd) {
    throw new Error('Planned start date and end date are required');
  }

  const startDate = new Date(plannedStart);
  const endDate = new Date(plannedEnd);

  if (endDate < startDate) {
    throw new Error('Planned end date cannot be earlier than planned start date');
  }

  let finalProgress = typeof progress === 'number' ? progress : Number(progress) || 0;
  if (finalProgress < 0) finalProgress = 0;
  if (finalProgress > 100) finalProgress = 100;

  let finalStatus = status || 'Not Started';
  let finalActualEnd = actualEnd ? new Date(actualEnd) : undefined;

  if (finalProgress === 100) {
    finalStatus = 'Completed';
    if (!finalActualEnd) {
      finalActualEnd = new Date();
    }
  } else if (finalStatus === 'Completed') {
    finalProgress = 100;
    if (!finalActualEnd) {
      finalActualEnd = new Date();
    }
  }

  let cleanOwnerId: any = undefined;
  if (ownerId && ownerId !== 'undefined' && ownerId !== 'null' && ownerId !== '') {
    cleanOwnerId = ownerId;
  }

  const milestone = new Milestone({
    projectId,
    name: name.trim(),
    description: description ? description.trim() : '',
    plannedStart: startDate,
    plannedEnd: endDate,
    actualEnd: finalActualEnd,
    ownerId: cleanOwnerId,
    status: finalStatus,
    progress: finalProgress,
    createdBy: userId
  });

  const saved = await milestone.save();
  return await Milestone.findById(saved._id)
    .populate('ownerId', 'employeeName email')
    .populate('createdBy', 'employeeName email')
    .lean();
};

export const updateMilestone = async (
  milestoneId: string,
  data: any,
  userId: string,
  userRole?: string,
  superAdmin?: boolean
) => {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  const project = await Project.findById(milestone.projectId);
  if (!project) {
    throw new Error('Associated project not found');
  }

  const isAdminLevel = superAdmin || userRole === 'Administrator';
  const isManager = userRole === 'Manager' && project.managerId?.toString() === userId;
  const isLead = userRole === 'Lead' && project.leadId?.toString() === userId;
  const isCreator = milestone.createdBy?.toString() === userId;

  if (!isAdminLevel && !isManager && !isLead && !isCreator) {
    throw new Error('Not authorized to update this milestone');
  }

  const { name, description, plannedStart, plannedEnd, actualEnd, ownerId, status, progress } = data;

  if (name !== undefined) {
    if (!name.trim()) throw new Error('Milestone name cannot be empty');
    milestone.name = name.trim();
  }

  if (description !== undefined) {
    milestone.description = description.trim();
  }

  if (plannedStart !== undefined) {
    milestone.plannedStart = new Date(plannedStart);
  }

  if (plannedEnd !== undefined) {
    milestone.plannedEnd = new Date(plannedEnd);
  }

  if (milestone.plannedEnd < milestone.plannedStart) {
    throw new Error('Planned end date cannot be earlier than planned start date');
  }

  if (ownerId !== undefined) {
    if (ownerId && ownerId !== 'undefined' && ownerId !== 'null' && ownerId !== '') {
      milestone.ownerId = ownerId as any;
    } else {
      milestone.ownerId = undefined as any;
    }
  }

  if (progress !== undefined) {
    let p = typeof progress === 'number' ? progress : Number(progress);
    if (isNaN(p)) p = milestone.progress;
    if (p < 0) p = 0;
    if (p > 100) p = 100;
    milestone.progress = p;
  }

  if (status !== undefined) {
    milestone.status = status;
  }

  if (milestone.progress === 100) {
    milestone.status = 'Completed';
    if (!milestone.actualEnd) {
      milestone.actualEnd = actualEnd ? new Date(actualEnd) : new Date();
    }
  } else if (milestone.status === 'Completed') {
    milestone.progress = 100;
    if (!milestone.actualEnd) {
      milestone.actualEnd = actualEnd ? new Date(actualEnd) : new Date();
    }
  } else if (actualEnd !== undefined) {
    milestone.actualEnd = actualEnd ? new Date(actualEnd) : undefined;
  }

  await milestone.save();

  return await Milestone.findById(milestoneId)
    .populate('ownerId', 'employeeName email')
    .populate('createdBy', 'employeeName email')
    .lean();
};

export const deleteMilestone = async (
  milestoneId: string,
  userId: string,
  userRole?: string,
  superAdmin?: boolean
) => {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  const project = await Project.findById(milestone.projectId);
  if (!project) {
    throw new Error('Associated project not found');
  }

  const isAdminLevel = superAdmin || userRole === 'Administrator';
  const isManager = userRole === 'Manager' && project.managerId?.toString() === userId;
  const isLead = userRole === 'Lead' && project.leadId?.toString() === userId;
  const isCreator = milestone.createdBy?.toString() === userId;

  if (!isAdminLevel && !isManager && !isLead && !isCreator) {
    throw new Error('Not authorized to delete this milestone');
  }

  await Milestone.findByIdAndDelete(milestoneId);
  return { message: 'Milestone deleted successfully' };
};

export const getMilestoneStats = async (projectId: string) => {
  const milestones = await Milestone.find({ projectId }).lean();
  const total = milestones.length;
  let completed = 0;
  let inProgress = 0;
  let delayed = 0;
  let notStarted = 0;

  for (const m of milestones) {
    if (m.status === 'Completed') {
      completed++;
    } else if (m.status === 'In Progress') {
      inProgress++;
    } else if (m.status === 'Delayed') {
      delayed++;
    } else {
      notStarted++;
    }
  }

  return {
    total,
    completed,
    inProgress,
    delayed,
    notStarted
  };
};
