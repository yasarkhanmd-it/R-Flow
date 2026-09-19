import mongoose, { Document, Schema, Types } from 'mongoose';
import './userModel';
import './projectModel';
import './taskModel';

export interface IActivityLog extends Document {
  actorUserId: Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: Types.ObjectId | string;
  entityName: string;
  description: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorName: {
      type: String,
      required: true
    },
    actorRole: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: Schema.Types.Mixed,
      required: true
    },
    entityName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

ActivityLogSchema.index({ entityId: 1, entityType: 1 });
ActivityLogSchema.index({ actorUserId: 1 });
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
