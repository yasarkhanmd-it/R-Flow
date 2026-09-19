import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ResourceAllocation } from '../models/resourceAllocationModel';
import { Project } from '../models/projectModel';
import { Task } from '../models/taskModel';
import { WorkLog } from '../models/workLogModel';
import { auditLogger } from '../utils/audit.logger';

const getUser = (req: Request) => (req as any).user;

export const getProjectResources = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.json({ success: true, data: [] });
    }
    const allocations = await ResourceAllocation.find({ projectId })
      .populate('userId', 'employeeName employeeId email role department')
      .populate('departmentId', 'departmentName departmentCode')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: allocations });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addOrUpdateResourceAllocation = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { userId, departmentId, projectRole, allocationPercentage, startDate, endDate, status } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    let allocation = await ResourceAllocation.findOne({ projectId, userId });

    if (allocation) {
      allocation.projectRole = projectRole || allocation.projectRole;
      if (allocationPercentage !== undefined) allocation.allocationPercentage = allocationPercentage;
      if (departmentId) allocation.departmentId = departmentId;
      if (startDate) allocation.startDate = startDate;
      if (endDate !== undefined) allocation.endDate = endDate;
      if (status) allocation.status = status;
      await allocation.save();
    } else {
      allocation = await ResourceAllocation.create({
        projectId,
        userId,
        departmentId: departmentId || null,
        projectRole: projectRole || 'Team Member',
        allocationPercentage: allocationPercentage !== undefined ? allocationPercentage : 100,
        startDate: startDate || new Date(),
        endDate: endDate || null,
        status: status || 'Active'
      });
    }

    // Ensure member is added to project.members list if not already present
    await Project.findByIdAndUpdate(projectId, { $addToSet: { members: userId } });

    const populated = await ResourceAllocation.findById(allocation._id)
      .populate('userId', 'employeeName employeeId email role department')
      .populate('departmentId', 'departmentName departmentCode');

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED_OR_UPDATED',
      entityType: 'RESOURCE_ALLOCATION',
      entityId: allocation._id,
      entityName: `Allocation for ${(populated?.userId as any)?.employeeName || userId}`,
      description: `Resource allocation added/updated for project ${projectId}`
    });

    res.status(200).json({ success: true, data: populated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteResourceAllocation = async (req: Request, res: Response) => {
  try {
    const { allocationId } = req.params;
    const deleted = await ResourceAllocation.findByIdAndDelete(allocationId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'RESOURCE_ALLOCATION',
      entityId: allocationId,
      entityName: 'Resource Allocation',
      description: `Resource allocation removed`
    });

    res.json({ success: true, message: 'Allocation removed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProjectResourceUtilization = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalAllocatedResources: 0,
            totalEstimatedHours: 0,
            totalActualHours: 0,
            remainingHours: 0,
            varianceHours: 0,
            overallUtilization: 0
          },
          resourceEffort: [],
          recentWorkLogs: []
        }
      });
    }

    const allocations = await ResourceAllocation.find({ projectId })
      .populate('userId', 'employeeName employeeId email role department')
      .populate('departmentId', 'departmentName departmentCode');

    // Active members
    const activeMembers = allocations.filter((a: any) => a.status === 'Active').length;

    const tasks = await Task.find({ projectId }).populate('assigneeId', 'employeeName');
    const workLogs = await WorkLog.find({ projectId }).populate('userId', 'employeeName');

    let totalEstimatedHours = 0;
    let totalActualHours = 0;

    tasks.forEach(t => {
      totalEstimatedHours += (t.estimatedHours || 0);
      totalActualHours += (t.actualHours || 0);
    });

    const remainingHours = Math.max(0, totalEstimatedHours - totalActualHours);
    const varianceHours = totalActualHours - totalEstimatedHours;
    const overallUtilization = totalEstimatedHours > 0 
      ? Math.round((totalActualHours / totalEstimatedHours) * 100) 
      : 0;

    // Resource-wise effort breakdown
    const resourceMap: Record<string, { userId: string; userName: string; allocatedPct: number; estimatedHours: number; actualHours: number }> = {};

    allocations.forEach(a => {
      const u = a.userId as any;
      if (u) {
        resourceMap[u._id.toString()] = {
          userId: u._id.toString(),
          userName: u.employeeName || 'Unknown',
          allocatedPct: a.allocationPercentage || 100,
          estimatedHours: 0,
          actualHours: 0
        };
      }
    });

    tasks.forEach(t => {
      const assignee = t.assigneeId as any;
      if (assignee && assignee._id) {
        const uid = assignee._id.toString();
        if (!resourceMap[uid]) {
          resourceMap[uid] = {
            userId: uid,
            userName: assignee.employeeName || 'Unknown',
            allocatedPct: 100,
            estimatedHours: 0,
            actualHours: 0
          };
        }
        resourceMap[uid].estimatedHours += (t.estimatedHours || 0);
        resourceMap[uid].actualHours += (t.actualHours || 0);
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalAllocatedResources: allocations.length,
          totalEstimatedHours,
          totalActualHours,
          remainingHours,
          varianceHours,
          overallUtilization
        },
        resourceEffort: Object.values(resourceMap),
        recentWorkLogs: workLogs.slice(-10)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
