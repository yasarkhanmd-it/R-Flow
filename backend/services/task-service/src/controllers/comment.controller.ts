import { Request, Response } from 'express';
import * as commentService from '../services/comment.service';

interface AuthRequest extends Request {
  user?: any;
}

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, content } = req.body;
    const user = req.user;
    const userId = user?._id || user?.id;

    const comment = await commentService.createComment(targetType, targetId, content, userId);
    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const comments = await commentService.getComments(targetType as any, targetId);
    res.status(200).json({ success: true, data: comments });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
