import { Request, Response } from 'express';
import * as projectService from '../services/project.service';
import { Project } from '../models/projectModel';
import { auditLogger } from '../utils/audit.logger';

export const getProjectOverview = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const overview = await projectService.getProjectOverview(projectId);
    res.json({ success: true, data: overview });
  } catch (error: any) {
    const status = error.message === 'Project not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};



export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, leadId, expectedEndDate } = req.body;
    const user = (req as any).user;

    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator';
    if (user?.role !== 'Manager' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'Only managers or administrators can create projects' });
    }

    const project = await projectService.createProject(req.body, user._id || user.id);
    
    // Audit log
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'PROJECT',
      entityId: project._id,
      entityName: project.name,
      description: `Project created: ${project.name}`
    });

    res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user?._id || user?.id;
    const projects = await projectService.getProjects(userId, user?.role, undefined, user?.superAdmin);
    res.json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const updateProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const user = (req as any).user;
    const updateData = req.body;

    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator';
    if (user?.role !== 'Manager' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'Only managers or administrators can update projects' });
    }

    const project = await projectService.updateProject(projectId, updateData, user._id || user.id, isAdminLevel);
    
    // Audit log
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'PROJECT',
      entityId: project._id,
      entityName: project.name,
      description: `Project updated: ${project.name}`
    });

    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const user = (req as any).user;

    if (user?.role !== 'Lead') {
      return res.status(403).json({ success: false, message: 'Only Team Leads can accept projects' });
    }

    const project = await projectService.acceptProject(projectId, user._id || user.id);
    
    // Audit log
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'ACCEPTED',
      entityType: 'PROJECT',
      entityId: project._id,
      entityName: project.name,
      description: `Project accepted by Lead: ${project.name}`
    });

    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const user = (req as any).user;
    const { reason } = req.body;

    if (user?.role !== 'Lead') {
      return res.status(403).json({ success: false, message: 'Only Team Leads can reject projects' });
    }

    const project = await projectService.rejectProject(projectId, user._id || user.id, reason);
    
    // Audit log
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'REJECTED',
      entityType: 'PROJECT',
      entityId: project._id,
      entityName: project.name,
      description: `Project rejected by Lead: ${project.name}. Reason: ${reason}`
    });

    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const requestJoin = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const user = (req as any).user;

    if (user?.role === 'Manager') {
      return res.status(400).json({ success: false, message: 'Managers cannot request to join projects' });
    }

    const notification = await projectService.requestJoinProject(projectId, user._id || user.id);
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const user = (req as any).user;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator';
    if (user?.role !== 'Manager' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this project' });
    }

    await projectService.deleteProject(projectId);
    
    // Audit log
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'PROJECT',
      entityId: projectId,
      entityName: project.name,
      description: `Project deleted: ${project.name}`
    });

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const leaveProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const user = (req as any).user;

    const project = await projectService.leaveProject(projectId, user._id || user.id);
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const memberId = req.params.memberId;
    const user = (req as any).user;

    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator';
    if (user?.role !== 'Manager' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'Only managers or administrators can remove members' });
    }

    const project = await projectService.removeMember(projectId, user._id || user.id, memberId, isAdminLevel);
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    const project = await projectService.addMemberToProject(projectId, userId);
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
