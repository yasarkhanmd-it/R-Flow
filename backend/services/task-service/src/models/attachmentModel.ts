import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAttachment extends Document {
  targetType: 'Module' | 'Task';
  targetId: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  uploadedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    targetType: {
      type: String,
      enum: ['Module', 'Task'],
      required: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType'
    },
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

AttachmentSchema.index({ targetId: 1, targetType: 1 });

export const Attachment = mongoose.models.Attachment || mongoose.model<IAttachment>('Attachment', AttachmentSchema);
