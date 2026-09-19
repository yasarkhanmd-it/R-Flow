import { Comment } from '../models/commentModel';

export const createComment = async (targetType: 'Module' | 'Task', targetId: string, content: string, authorId: string) => {
  const comment = new Comment({
    targetType,
    targetId,
    content,
    authorId
  });
  return await comment.save();
};

export const getComments = async (targetType: 'Module' | 'Task', targetId: string) => {
  return await Comment.find({ targetType, targetId })
    .populate('authorId', 'employeeName')
    .sort({ createdAt: -1 });
};
