import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  projectId: Types.ObjectId;
  moduleId?: Types.ObjectId;
  taskId: string;
  summary: string;
  status: string;
}

const TaskSchema = new Schema<ITask>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module' },
  taskId: { type: String, required: true },
  summary: { type: String, required: true },
  status: { type: String, default: 'To Do' }
}, { timestamps: true });

export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
