import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMilestone extends Document {
  projectId: Types.ObjectId;
  name: string;
  description?: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualEnd?: Date;
  ownerId?: Types.ObjectId;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  progress: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  plannedStart: { type: Date, required: true },
  plannedEnd: { type: Date, required: true },
  actualEnd: { type: Date },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Delayed'],
    default: 'Not Started'
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Milestone = mongoose.models.Milestone || mongoose.model<IMilestone>('Milestone', MilestoneSchema);
