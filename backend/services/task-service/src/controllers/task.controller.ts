import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as taskService from '../services/task.service';
import { ITask, Task } from '../models/taskModel';
import { Project } from '../models/projectModel';
import { Module } from '../models/moduleModel';
import { Notification } from '../models/notificationModel';
import { auditLogger } from '../utils/audit.logger';

interface AuthRequest extends Request {
  user?: any;
}

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskData: Partial<ITask> = req.body;
    const user = req.user;
    const userId = user?._id || user?.id;

    if (!taskData.moduleId || taskData.moduleId === '' as any || taskData.moduleId === 'null' as any || taskData.moduleId === 'undefined' as any) {
      delete taskData.moduleId;
    }

    const project = await Project.findById(taskData.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (user.role === 'Lead') {
      if (project.leadId?.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'You are not the assigned Team Lead for this project' });
      }
      if (project.status !== 'Accepted' && project.status !== 'Active') {
        return res.status(403).json({ success: false, message: 'Project has not been accepted yet' });
      }

      if (taskData.assigneeId) {
        const isMember = project.members.some((m: any) => m.toString() === taskData.assigneeId!.toString()) ||
          (project.leadId && project.leadId.toString() === taskData.assigneeId.toString()) ||
          project.managerId.toString() === taskData.assigneeId.toString();
        if (!isMember) {
          return res.status(400).json({ success: false, message: 'Assignee is not a member of this project' });
        }
      }
    }

    if (user) {
      taskData.reporterId = userId;

      if (!taskData.assigneeId) {
        taskData.assigneeId = userId;
      }
    }

    if (taskData.moduleId) {
      const module = await Module.findById(taskData.moduleId);
      if (!module) {
        return res.status(404).json({ success: false, message: 'Module not found' });
      }
    }

    taskData.status = 'To Do';

    const newTask = await taskService.createTask(taskData);

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'TASK',
      entityId: newTask._id,
      entityName: newTask.taskId,
      description: `Task ${newTask.taskId} was created`
    });

    res.status(201).json({
      success: true,
      data: newTask
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating task'
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const userId = user?._id || user?.id;
    const query: any = {};

    if (req.query.projectId && req.query.projectId !== '' && req.query.projectId !== 'undefined' && req.query.projectId !== 'null' && req.query.projectId !== 'all') {
      const val = req.query.projectId as string;
      query.projectId = mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val;
    }
    if (req.query.moduleId && req.query.moduleId !== '' && req.query.moduleId !== 'undefined' && req.query.moduleId !== 'null' && req.query.moduleId !== 'all') {
      const val = req.query.moduleId as string;
      query.moduleId = mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val;
    }
    if (req.query.assigneeId && req.query.assigneeId !== '' && req.query.assigneeId !== 'undefined' && req.query.assigneeId !== 'null') {
      const val = req.query.assigneeId as string;
      query.assigneeId = mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val;
    }
    if (req.query.departmentId && req.query.departmentId !== '' && req.query.departmentId !== 'undefined' && req.query.departmentId !== 'null') {
      const val = req.query.departmentId as string;
      query.departmentId = mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val;
    }
    if (req.query.workflowStageId && req.query.workflowStageId !== '' && req.query.workflowStageId !== 'undefined' && req.query.workflowStageId !== 'null') {
      const val = req.query.workflowStageId as string;
      query.workflowStageId = mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 0,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc'
    };

    let result = await taskService.getTasks(query, options as any);


    res.status(200).json({
      success: true,
      count: result.count,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      data: result.data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const updateData = req.body;
    const user = req.user;
    const userId = user?._id || user?.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (user.role === 'Lead') {
      if (project.leadId?.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'You are not the assigned Team Lead for this project' });
      }

      if (updateData.assigneeId) {
        const isMember = project.members.some((m: any) => m.toString() === updateData.assigneeId.toString()) ||
          (project.leadId && project.leadId.toString() === updateData.assigneeId.toString()) ||
          project.managerId.toString() === updateData.assigneeId.toString();
        if (!isMember) {
          return res.status(400).json({ success: false, message: 'Assignee is not a member of this project' });
        }
      }
    } else if (user.role === 'Employee' || user.role === 'User') {
      const isManager = project.managerId.toString() === userId.toString();
      const isMember = project.members.some((mId: any) => mId.toString() === userId.toString());
      if (!isManager && !isMember) {
        return res.status(403).json({ success: false, message: 'You are not a member of this project and cannot update its tasks' });
      }

      const isCreator = task.reporterId.toString() === userId.toString();
      
      if (!isCreator) {
        const allowedFields = ['status'];
        for (const field of Object.keys(updateData)) {
          if (!allowedFields.includes(field) && updateData[field] !== (task as any)[field] && updateData[field] !== undefined) {
            return res.status(403).json({
              success: false,
              message: `You can only edit task details on tasks created by you. For other tasks, you can only update the status.`
            });
          }
        }
      } else {
        const restrictedFields = ['projectId', 'taskId', 'moduleId'];
        for (const field of restrictedFields) {
           if (updateData[field] !== undefined && updateData[field] !== (task as any)[field]) {
             return res.status(403).json({
               success: false,
               message: `Employees cannot change the project or module of a task.`
             });
           }
        }
        
        if (updateData.assigneeId && updateData.assigneeId.toString() !== task.assigneeId?.toString()) {
          const isNewAssigneeMember = project.members.some((mId: any) => mId.toString() === updateData.assigneeId.toString()) ||
            (project.leadId && project.leadId.toString() === updateData.assigneeId.toString()) ||
            project.managerId.toString() === updateData.assigneeId.toString();
          
          if (!isNewAssigneeMember) {
             return res.status(400).json({ success: false, message: 'Assignee is not a member of this project' });
          }
        }
      }
    }

    const oldStatus = task.status;
    const newStatus = updateData.status;

    const updatedTask = await taskService.updateTask(taskId, updateData);

    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (newStatus === 'Done' && oldStatus !== 'Done' && project.leadId) {
      if (userId.toString() !== project.leadId.toString()) {
        const notification = new Notification({
          type: 'EMPLOYEE_COMPLETED_TASK',
          fromUser: userId,
          toUser: project.leadId,
          project: project._id,
          task: updatedTask._id,
          message: updatedTask.taskId
        });
        await notification.save();
      }
    }

    let actionDesc = 'UPDATED';
    let detailDesc = `Task ${updatedTask.taskId} was updated`;
    if (newStatus !== oldStatus) {
      actionDesc = 'STATUS_CHANGED';
      detailDesc = `Task ${updatedTask.taskId} status changed from ${oldStatus} to ${newStatus}`;
    }

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: actionDesc,
      entityType: 'TASK',
      entityId: updatedTask._id,
      entityName: updatedTask.taskId,
      description: detailDesc
    });

    res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating task'
    });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const user = req.user;
    const userId = user?._id || user?.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project associated with task not found' });
    }

    if (user.role === 'Employee' || user.role === 'User') {
      return res.status(403).json({ success: false, message: 'Employees are not permitted to delete tasks' });
    }

    if (user.role === 'Lead') {
      if (project.leadId?.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'You are not the assigned Team Lead for this project' });
      }
    } else if (user.role === 'Manager') {
      const isManager = project.managerId.toString() === userId.toString();
      if (!isManager) {
        return res.status(403).json({ success: false, message: 'You do not have permission to delete this task' });
      }
    }

    await taskService.deleteTask(taskId);

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'TASK',
      entityId: taskId,
      entityName: task.taskId,
      description: `Task ${task.taskId} was deleted`
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

export const requestClarification = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const { message } = req.body;
    const user = req.user;
    const userId = user?._id || user?.id;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Clarification message is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project associated with task not found' });
    }

    if (!project.leadId) {
      return res.status(400).json({ success: false, message: 'No Team Lead is assigned to this project' });
    }

    const notification = new Notification({
      type: 'EMPLOYEE_REQUESTED_CLARIFICATION',
      fromUser: userId,
      toUser: project.leadId,
      project: project._id,
      task: task._id,
      message: message
    });
    await notification.save();

    res.json({ success: true, message: 'Clarification requested successfully', data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
