import { Request, Response } from 'express';
import { WorkLog } from '../models/workLogModel';
import { Task } from '../models/taskModel';

const getUser = (req: Request) => (req as any).user;

export const getTaskWorkLogs = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const logs = await WorkLog.find({ taskId })
      .populate('userId', 'employeeName employeeId email')
      .sort({ workDate: -1 });

    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addWorkLog = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const user = getUser(req);
    const userId = user?._id || user?.id || req.body.userId;
    const { hoursLogged, workDate, description } = req.body;

    if (!hoursLogged || hoursLogged <= 0) {
      return res.status(400).json({ success: false, message: 'Valid hoursLogged is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const log = await WorkLog.create({
      taskId,
      projectId: task.projectId,
      userId,
      hoursLogged: Number(hoursLogged),
      workDate: workDate || new Date(),
      description: description || ''
    });

    // Recompute & update actualHours on Task
    const logs = await WorkLog.find({ taskId });
    const totalActual = logs.reduce((sum: number, item: any) => sum + (item.hoursLogged || 0), 0);
    
    task.actualHours = totalActual;
    await task.save();

    const populated = await WorkLog.findById(log._id).populate('userId', 'employeeName employeeId email');

    res.status(201).json({ success: true, data: populated, taskActualHours: totalActual });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteWorkLog = async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;
    const log = await WorkLog.findByIdAndDelete(logId);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Work log not found' });
    }

    // Recompute actualHours on task
    const logs = await WorkLog.find({ taskId: log.taskId });
    const totalActual = logs.reduce((sum: number, item: any) => sum + (item.hoursLogged || 0), 0);
    await Task.findByIdAndUpdate(log.taskId, { actualHours: totalActual });

    res.json({ success: true, message: 'Work log removed', taskActualHours: totalActual });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
