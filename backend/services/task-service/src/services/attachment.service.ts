import { Attachment } from '../models/attachmentModel';

export const createAttachment = async (targetType: 'Module' | 'Task', targetId: string, fileName: string, fileUrl: string, uploadedBy: string) => {
  const attachment = new Attachment({
    targetType,
    targetId,
    fileName,
    fileUrl,
    uploadedBy
  });
  return await attachment.save();
};

export const getAttachments = async (targetType: 'Module' | 'Task', targetId: string) => {
  return await Attachment.find({ targetType, targetId })
    .populate('uploadedBy', 'employeeName')
    .sort({ createdAt: -1 });
};

export const deleteAttachment = async (attachmentId: string) => {
  return await Attachment.findByIdAndDelete(attachmentId);
};
