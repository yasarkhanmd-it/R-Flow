import { Request, Response } from 'express';
import { ChangeRequest } from '../models/changeRequestModel';
import { auditLogger } from '../utils/audit.logger';

export const getChangeRequests = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const crs = await ChangeRequest.find({ projectId })
      .populate('ownerId', 'employeeName email')
      .populate('requestedById', 'employeeName email')
      .lean();
    res.json({ success: true, data: crs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createChangeRequest = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;
    const cr = new ChangeRequest({
      ...req.body,
      projectId,
      createdBy: user.id,
      requestedById: user.id // Default requester to current user if not provided in body
    });
    
    if (req.body.requestedById) {
      cr.requestedById = req.body.requestedById;
    }
    
    await cr.save();

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'CHANGE_REQUEST',
      entityId: cr._id,
      entityName: cr.title,
      description: `Change Request created: ${cr.title}`
    });

    res.status(201).json({ success: true, data: cr });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateChangeRequest = async (req: Request, res: Response) => {
  try {
    const { crId } = req.params; // this is the _id in MongoDB
    const cr = await ChangeRequest.findByIdAndUpdate(
      crId,
      { $set: req.body },
      { new: true }
    );
    if (!cr) {
      return res.status(404).json({ success: false, message: 'Change Request not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'CHANGE_REQUEST',
      entityId: cr._id,
      entityName: cr.title,
      description: `Change Request updated: ${cr.title}`
    });

    res.json({ success: true, data: cr });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteChangeRequest = async (req: Request, res: Response) => {
  try {
    const { crId } = req.params;
    const cr = await ChangeRequest.findByIdAndDelete(crId);
    if (!cr) {
      return res.status(404).json({ success: false, message: 'Change Request not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'CHANGE_REQUEST',
      entityId: crId,
      entityName: cr.title,
      description: `Change Request deleted: ${cr.title}`
    });

    res.json({ success: true, message: 'Change Request deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
