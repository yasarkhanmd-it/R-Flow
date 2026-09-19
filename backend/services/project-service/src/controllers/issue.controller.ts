import { Request, Response } from 'express';
import { Issue } from '../models/issueModel';
import { auditLogger } from '../utils/audit.logger';

export const getIssues = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const issues = await Issue.find({ projectId })
      .populate('ownerId', 'employeeName email')
      .populate('reportedById', 'employeeName email')
      .lean();
    res.json({ success: true, data: issues });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createIssue = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;
    const issue = new Issue({
      ...req.body,
      projectId,
      createdBy: user.id,
      reportedById: user.id // Default reporter to current user if not provided in body, but body can override if admin creates it for someone else
    });
    
    // Override if reportedById is explicitly provided (and allowed)
    if (req.body.reportedById) {
      issue.reportedById = req.body.reportedById;
    }
    
    await issue.save();

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'ISSUE',
      entityId: issue._id,
      entityName: issue.title,
      description: `Issue created: ${issue.title}`
    });

    res.status(201).json({ success: true, data: issue });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params; // this is the _id in MongoDB, even though our path var is issueId
    const issue = await Issue.findByIdAndUpdate(
      issueId,
      { $set: req.body },
      { new: true }
    );
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'ISSUE',
      entityId: issue._id,
      entityName: issue.title,
      description: `Issue updated: ${issue.title}`
    });

    res.json({ success: true, data: issue });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findByIdAndDelete(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'ISSUE',
      entityId: issueId,
      entityName: issue.title,
      description: `Issue deleted: ${issue.title}`
    });

    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
