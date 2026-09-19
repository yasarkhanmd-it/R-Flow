import mongoose from 'mongoose';
import { Request, Response } from 'express';
import * as moduleService from '../services/module.service';
import { Project } from '../models/projectModel';
import { Module } from '../models/moduleModel';
import { auditLogger } from '../utils/audit.logger';

interface AuthRequest extends Request {
  user?: any;
}

export const createModule = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, name, description, dueDate } = req.body;
    const user = req.user;
    const userId = user?._id || user?.id;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: 'Valid Project ID is required' });
    }

    const newModule = await moduleService.createModule(projectId, name, description, userId, dueDate);

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'MODULE',
      entityId: newModule._id,
      entityName: newModule.name,
      description: `Module/Story ${newModule.name} was created`
    });

    res.status(201).json({ success: true, data: newModule });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getModules = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = req.params.projectId;
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const modules = await moduleService.getModules(projectId);
    res.status(200).json({ success: true, data: modules });
  } catch (error: any) {
    console.error('Error in getModules:', error);
    res.status(200).json({ success: true, data: [] });
  }
};

export const getAllModules = async (req: AuthRequest, res: Response) => {
  try {
    const modules = await moduleService.getAllModules();
    res.status(200).json({ success: true, data: modules });
  } catch (error: any) {
    require('fs').writeFileSync('d:/rflow/backend/services/story-service/error.log', (error.stack || error.message || String(error)));
    res.status(200).json({ success: true, data: [] });
  }
};

export const getModuleById = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.id;
    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }
    const module = await moduleService.getModuleById(moduleId);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    return res.status(200).json({ success: true, data: module });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateModule = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.id;
    const updateData = req.body;
    const user = req.user;
    const userId = user?._id || user?.id;

    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });

    if (user.role === 'User' || user.role === 'Employee') {
      if (module.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'You can only edit your own modules' });
      }
      if (module.status === 'Approved' || module.status === 'In Progress' || module.status === 'Completed' || module.status === 'Closed') {
        return res.status(403).json({ success: false, message: 'You cannot edit this module as it has already been processed' });
      }
    }

    const updatedModule = await moduleService.updateModule(moduleId, updateData);
    
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'MODULE',
      entityId: updatedModule._id,
      entityName: updatedModule.name,
      description: `Module/Story ${updatedModule.name} was updated`
    });

    res.status(200).json({ success: true, data: updatedModule });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteModule = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.id;
    const user = req.user;

    if (user.role === 'User' || user.role === 'Employee') {
      return res.status(403).json({ success: false, message: 'Employees cannot delete modules' });
    }

    await moduleService.deleteModule(moduleId);
    
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'MODULE',
      entityId: moduleId,
      entityName: 'Unknown Module', // Cannot get easily without fetching first, but this is fine
      description: `Module/Story was deleted`
    });

    res.status(200).json({ success: true, message: 'Module deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const approveModule = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.id;
    const user = req.user;
    const userId = user?._id || user?.id;
    
    if (user.role !== 'Manager' && user.role !== 'Lead') {
      return res.status(403).json({ success: false, message: 'Only Managers and Team Leads can approve modules' });
    }

    const moduleToApprove = await Module.findById(moduleId);
    if (!moduleToApprove) return res.status(404).json({ success: false, message: 'Module not found' });

    if (user.role === 'Lead') {
      const project = await Project.findById(moduleToApprove.projectId);
      if (project?.leadId?.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'You are not the assigned Team Lead for this project' });
      }
    }

    const module = await moduleService.approveModule(moduleId, userId);
    
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'APPROVED',
      entityType: 'MODULE',
      entityId: module._id,
      entityName: module.name,
      description: `Module/Story ${module.name} was approved`
    });

    res.status(200).json({ success: true, data: module });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectModule = async (req: AuthRequest, res: Response) => {
  try {
    const moduleId = req.params.id;
    const user = req.user;
    const userId = user?._id || user?.id;
    const { reason } = req.body;

    if (user.role !== 'Manager' && user.role !== 'Lead') {
      return res.status(403).json({ success: false, message: 'Only Managers and Team Leads can reject modules' });
    }

    const moduleToReject = await Module.findById(moduleId);
    if (!moduleToReject) return res.status(404).json({ success: false, message: 'Module not found' });

    if (user.role === 'Lead') {
      const project = await Project.findById(moduleToReject.projectId);
      if (project?.leadId?.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: 'You are not the assigned Team Lead for this project' });
      }
    }

    const module = await moduleService.rejectModule(moduleId, userId, reason);
    
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'REJECTED',
      entityType: 'MODULE',
      entityId: module._id,
      entityName: module.name,
      description: `Module/Story ${module.name} was rejected. Reason: ${reason}`
    });

    res.status(200).json({ success: true, data: module });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
