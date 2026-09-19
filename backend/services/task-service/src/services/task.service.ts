import { Task, ITask } from '../models/taskModel';
import { Project } from '../models/projectModel';
import { User } from '../models/userModel';
import { Comment } from '../models/commentModel';
import { Attachment } from '../models/attachmentModel';
import { ActivityLog } from '../models/activityLogModel';
import { Notification } from '../models/notificationModel';
import { Module } from '../models/moduleModel';

const TASK_POPULATE = [
  { path: 'projectId', select: 'name' },
  { path: 'moduleId',  select: 'name' },
  { path: 'departmentId', select: 'departmentName departmentCode' },
  { path: 'workflowStageId', select: 'name order isInitial isFinal' },
  { path: 'assigneeId', select: 'employeeName employeeId' },
  { path: 'reporterId', select: 'employeeName employeeId' },
] as const;

const generateTaskPrefix = (projectName: string): string =>
  projectName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 4);

export const createTask = async (taskData: Partial<ITask>): Promise<ITask> => {
  const project = await Project.findById(taskData.projectId).select('name').lean();
  if (!project) throw new Error('Project not found');

  const prefix = generateTaskPrefix(project.name);

  const lastTask = await Task.findOne({ projectId: taskData.projectId })
    .sort({ createdAt: -1 })
    .select('taskId')
    .lean();

  let nextNumber = 1;
  if (lastTask?.taskId) {
    const parts = lastTask.taskId.split('-');
    if (parts.length === 2) {
      const n = parseInt(parts[1], 10);
      if (!isNaN(n)) nextNumber = n + 1;
    }
  }

  const newTask = new Task({
    ...taskData,
    taskId: `${prefix}-${nextNumber.toString().padStart(3, '0')}`
  });

  const saved = await newTask.save();
  const populated = await Task.findById(saved._id).populate(TASK_POPULATE as any);
  return (populated as unknown as ITask) || saved;
};

export const getTasks = async (
  baseQuery: any = {},
  options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{ data: ITask[]; total: number; page: number; totalPages: number; count: number }> => {
  const page  = Math.max(1, options.page  || 1);
  const limit = Math.max(0, options.limit || 0);
  const skip  = (page - 1) * limit;
  const order = options.sortOrder === 'asc' ? 1 : -1;

  let query: any = { ...baseQuery };

  if (options.search) {
    const searchRegex = new RegExp(options.search, 'i');

    const [userIds] = await Promise.all([
      User.find({ employeeName: searchRegex }).select('_id').lean().then(u => u.map(x => x._id))
    ]);

    const searchCond = {
      $or: [
        { summary: searchRegex },
        { taskId:  searchRegex },
        ...(userIds.length ? [{ assigneeId: { $in: userIds } }] : [])
      ]
    };

    query = query.$and
      ? { ...query, $and: [...query.$and, searchCond] }
      : { ...query, ...searchCond };
  }

  const SORT_FIELD_MAP: Record<string, any> = {
    Newest:      { createdAt: -1 },
    Oldest:      { createdAt:  1 },
    'Due Date':  { dueDate: order },
    'Task Name': { summary: order },
    taskId:      { taskId: order },
  };

  const usePriorityAgg = options.sortBy === 'Priority';
  const sortObj = usePriorityAgg
    ? null
    : (SORT_FIELD_MAP[options.sortBy || 'Newest'] || { createdAt: -1 });

  let tasks: ITask[];
  let total: number;

  if (usePriorityAgg) {
    const aggPipeline: any[] = [
      { $match: query },
      {
        $addFields: {
          priorityWeight: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'Critical'] }, then: 4 },
                { case: { $eq: ['$priority', 'High'] },     then: 3 },
                { case: { $eq: ['$priority', 'Medium'] },   then: 2 },
                { case: { $eq: ['$priority', 'Low'] },      then: 1 },
              ],
              default: 0
            }
          }
        }
      },
      { $sort: { priorityWeight: order, createdAt: -1 } },
    ];

    const [countResult, rawTasks] = await Promise.all([
      Task.countDocuments(query),
      Task.aggregate([
        ...aggPipeline,
        ...(skip  > 0 ? [{ $skip: skip  }] : []),
        ...(limit > 0 ? [{ $limit: limit }] : []),
      ])
    ]);

    total = countResult;
    tasks = await Task.populate(rawTasks, TASK_POPULATE as any);
  } else {
    const q = Task.find(query)
      .populate(TASK_POPULATE as any)
      .sort(sortObj)
      .lean();

    if (skip  > 0) q.skip(skip);
    if (limit > 0) q.limit(limit);

    const [countResult, data] = await Promise.all([
      Task.countDocuments(query),
      q.exec()
    ]);

    total = countResult;
    tasks = data as unknown as ITask[];
  }

  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  return { data: tasks, count: tasks.length, total, page, totalPages };
};

export const updateTask = async (id: string, updateData: Partial<ITask>): Promise<ITask | null> => {
  return Task.findByIdAndUpdate(id, updateData, { new: true })
    .populate(TASK_POPULATE as any);
};

export const deleteTask = async (id: string): Promise<ITask | null> => {
  const deleted = await Task.findByIdAndDelete(id).lean();
  if (deleted) {
    await Promise.all([
      Comment.deleteMany({ targetType: 'Task', targetId: id }),
      Attachment.deleteMany({ targetType: 'Task', targetId: id }),
      ActivityLog.deleteMany({ targetType: 'Task', targetId: id }),
      Notification.deleteMany({ task: id }),
    ]);
  }
  return deleted as unknown as ITask | null;
};
