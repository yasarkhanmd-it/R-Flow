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
  status: string;
}

const NotificationSchema = new Schema<INotification>({
  type: { type: String, required: true },
  fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  task: { type: Schema.Types.ObjectId, ref: 'Task' },
  message: { type: String, default: '' },
  status: { type: String, default: 'PENDING' }
}, { timestamps: true });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
