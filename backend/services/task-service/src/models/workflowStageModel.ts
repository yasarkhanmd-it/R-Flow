import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWorkflowStage extends Document {
  name: string;
  order: number;
  isInitial?: boolean;
  isFinal?: boolean;
}

const WorkflowStageSchema = new Schema<IWorkflowStage>(
  {
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    isInitial: { type: Boolean, default: false },
    isFinal: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const WorkflowStage =
  mongoose.models.WorkflowStage ||
  mongoose.model<IWorkflowStage>('WorkflowStage', WorkflowStageSchema);
