import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  targetType: string;
  targetId: Types.ObjectId;
}

const CommentSchema = new Schema<IComment>({
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true }
});

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
