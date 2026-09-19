import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  targetType: 'Module' | 'Task' | 'Project';
  targetId: Types.ObjectId;
  action: string;
  details: string;
  performedBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    targetType: {
      type: String,
      enum: ['Module', 'Task', 'Project'],
      required: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType'
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: String,
      default: ''
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

ActivityLogSchema.index({ targetId: 1, targetType: 1 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
