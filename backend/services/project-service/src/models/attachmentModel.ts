import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAttachment extends Document {
  targetType: string;
  targetId: Types.ObjectId;
  fileName: string;
}

const AttachmentSchema = new Schema<IAttachment>({
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  fileName: { type: String, required: true }
}, { timestamps: true });

export const Attachment = mongoose.models.Attachment || mongoose.model<IAttachment>('Attachment', AttachmentSchema);
