import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAttachment extends Document {
  targetType: string;
  targetId: Types.ObjectId;
}

const AttachmentSchema = new Schema<IAttachment>({
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true }
});

export const Attachment = mongoose.models.Attachment || mongoose.model<IAttachment>('Attachment', AttachmentSchema);
