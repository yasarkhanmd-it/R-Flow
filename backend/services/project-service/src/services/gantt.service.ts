import { Project } from '../models/projectModel';
import { Milestone } from '../models/milestoneModel';
import { Module } from '../models/moduleModel';
import { Task } from '../models/taskModel';

export interface GanttItem {
  id: string;
  title: string;
  type: 'project' | 'milestone' | 'module' | 'task';
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  priority?: string;
  assignee?: { _id: string; employeeName: string };
  owner?: { _id: string; employeeName: string };
  moduleId?: string;
  parentId?: string;
  taskCount?: number;
  completedTaskCount?: number;
}

export const getGanttData = async (projectId: string) => {
  const project = await Project.findById(projectId)
    .populate('managerId', 'employeeName email')
    .populate('leadId', 'employeeName email')
    .lean();

  if (!project) {
    throw new Error('Project not found');
  }

  const [milestones, modules, tasks] = await Promise.all([
    Milestone.find({ projectId }).populate('ownerId', 'employeeName email').lean(),
    Module.find({ projectId }).lean(),
    Task.find({ projectId }).populate('assigneeId', 'employeeName email').lean()
  ]);

  // Helper to map task status to progress %
  const getTaskProgress = (status: string): number => {
    switch (status) {
      case 'Done':
      case 'Completed':
        return 100;
      case 'Pending Review':
        return 80;
      case 'In Progress':
        return 50;
      case 'Blocked':
        return 25;
      default:
        return 0;
    }
  };

  // Format Tasks
  const ganttTasks: GanttItem[] = tasks.map(t => {
    const sDate = t.startDate ? new Date(t.startDate) : new Date(t.createdAt || Date.now());
    let eDate = t.dueDate ? new Date(t.dueDate) : new Date(sDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    if (eDate < sDate) {
      eDate = new Date(sDate.getTime() + 24 * 60 * 60 * 1000);
    }

    return {
      id: t._id.toString(),
      title: `${t.taskId}: ${t.summary}`,
      type: 'task',
      startDate: sDate.toISOString(),
      endDate: eDate.toISOString(),
      progress: getTaskProgress(t.status),
      status: t.status,
      priority: t.priority,
      assignee: t.assigneeId ? {
        _id: (t.assigneeId as any)._id?.toString() || (t.assigneeId as any).toString(),
        employeeName: (t.assigneeId as any).employeeName || 'Assigned User'
      } : undefined,
      moduleId: t.moduleId ? t.moduleId.toString() : undefined,
      parentId: t.moduleId ? t.moduleId.toString() : undefined
    };
  });

  // Format Modules
  const ganttModules: GanttItem[] = modules.map(m => {
    const mTasks = ganttTasks.filter(gt => gt.moduleId === m._id.toString());
    let sDate: Date;
    let eDate: Date;

    if (mTasks.length > 0) {
      const startTimes = mTasks.map(t => new Date(t.startDate).getTime());
      const endTimes = mTasks.map(t => new Date(t.endDate).getTime());
      sDate = new Date(Math.min(...startTimes));
      eDate = new Date(Math.max(...endTimes));
    } else {
      sDate = project.startDate ? new Date(project.startDate) : new Date(project.createdAt || Date.now());
      eDate = project.expectedEndDate ? new Date(project.expectedEndDate) : new Date(sDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const totalT = mTasks.length;
    const completedT = mTasks.filter(t => t.progress === 100).length;
    const prog = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;

    return {
      id: m._id.toString(),
      title: m.name,
      type: 'module',
      startDate: sDate.toISOString(),
      endDate: eDate.toISOString(),
      progress: prog,
      status: m.status || 'Active',
      taskCount: totalT,
      completedTaskCount: completedT
    };
  });

  // Format Milestones
  const ganttMilestones: GanttItem[] = milestones.map(m => {
    const sDate = m.plannedStart ? new Date(m.plannedStart) : new Date();
    const eDate = m.plannedEnd ? new Date(m.plannedEnd) : new Date(sDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      id: m._id.toString(),
      title: m.name,
      type: 'milestone',
      startDate: sDate.toISOString(),
      endDate: eDate.toISOString(),
      progress: m.progress || 0,
      status: m.status,
      owner: m.ownerId ? {
        _id: (m.ownerId as any)._id?.toString() || (m.ownerId as any).toString(),
        employeeName: (m.ownerId as any).employeeName || 'Owner'
      } : undefined
    };
  });

  // Project overall bounds calculation
  let projStart = project.startDate ? new Date(project.startDate) : new Date(project.createdAt || Date.now());
  let projEnd = project.expectedEndDate ? new Date(project.expectedEndDate) : new Date(projStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  const allDates = [
    ...ganttTasks.map(t => new Date(t.startDate)),
    ...ganttTasks.map(t => new Date(t.endDate)),
    ...ganttMilestones.map(m => new Date(m.startDate)),
    ...ganttMilestones.map(m => new Date(m.endDate))
  ];

  if (allDates.length > 0) {
    const minD = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxD = new Date(Math.max(...allDates.map(d => d.getTime())));
    if (minD < projStart) projStart = minD;
    if (maxD > projEnd) projEnd = maxD;
  }

  const totalTasks = ganttTasks.length;
  const completedTasks = ganttTasks.filter(t => t.progress === 100).length;
  const projectProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const projectItem: GanttItem = {
    id: project._id.toString(),
    title: project.name,
    type: 'project',
    startDate: projStart.toISOString(),
    endDate: projEnd.toISOString(),
    progress: projectProgress,
    status: project.status,
    taskCount: totalTasks,
    completedTaskCount: completedTasks
  };

  return {
    project: projectItem,
    milestones: ganttMilestones,
    modules: ganttModules,
    tasks: ganttTasks,
    bounds: {
      startDate: projStart.toISOString(),
      endDate: projEnd.toISOString()
    }
  };
};
