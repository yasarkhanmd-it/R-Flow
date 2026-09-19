import mongoose, { Document, Schema, Types } from 'mongoose';
import './userModel';
import './projectModel';
import './taskModel';

export interface INotification extends Document {
  type: string;
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;
  project?: Types.ObjectId;
  task?: Types.ObjectId;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true
    },
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project'
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    },
    message: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

NotificationSchema.index({ toUser: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ task: 1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
