import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  targetType: string;
  targetId: Types.ObjectId;
  content: string;
}

const CommentSchema = new Schema<IComment>({
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  content: { type: String, required: true }
}, { timestamps: true });

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
