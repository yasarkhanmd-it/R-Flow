import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  moduleId?: Types.ObjectId;
}

const TaskSchema = new Schema<ITask>({
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module' }
});

export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
