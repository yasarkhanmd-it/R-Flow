import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  projectId: Types.ObjectId;
  moduleId?: Types.ObjectId;
  taskId: string;
  summary: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  estimatedHours?: number;
  assigneeId?: Types.ObjectId;
  reporterId: Types.ObjectId;
  startDate?: Date;
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const TaskSchema = new Schema<ITask>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module' },
  taskId: { type: String, required: true },
  summary: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, default: 'Task' },
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'To Do' },
  estimatedHours: { type: Number, default: 0 },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date },
  dueDate: { type: Date }
}, { timestamps: true });

export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
