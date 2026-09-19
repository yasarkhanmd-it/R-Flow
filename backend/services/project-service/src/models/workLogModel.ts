import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkLog extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  workDate: Date;
  hoursLogged: number;
  description: string;
}

const WorkLogSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  workDate: { type: Date, required: true },
  hoursLogged: { type: Number, required: true },
  description: { type: String }
}, {
  timestamps: true
});

export const WorkLog = mongoose.model<IWorkLog>('WorkLog', WorkLogSchema);
