import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  summary: string;
}

const TaskSchema = new Schema<ITask>({
  summary: { type: String, required: true }
});

export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
