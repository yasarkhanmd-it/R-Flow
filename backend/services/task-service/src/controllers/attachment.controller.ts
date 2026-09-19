import { Request, Response } from 'express';
import * as attachmentService from '../services/attachment.service';

interface AuthRequest extends Request {
  user?: any;
}

export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, fileName, fileUrl } = req.body;
    const user = req.user;
    const userId = user?._id || user?.id;

    const attachment = await attachmentService.createAttachment(targetType, targetId, fileName, fileUrl, userId);
    res.status(201).json({ success: true, data: attachment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const attachments = await attachmentService.getAttachments(targetType as any, targetId);
    res.status(200).json({ success: true, data: attachments });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await attachmentService.deleteAttachment(id);
    res.status(200).json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
