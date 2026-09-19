import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  targetType: 'Module' | 'Task';
  targetId: Types.ObjectId;
  content: string;
  authorId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const CommentSchema = new Schema<IComment>(
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
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

CommentSchema.index({ targetId: 1, targetType: 1 });

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
