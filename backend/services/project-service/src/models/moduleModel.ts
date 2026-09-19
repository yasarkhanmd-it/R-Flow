import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IModule extends Document {
  projectId: Types.ObjectId;
  name: string;
  description: string;
  status: string;
  createdBy: Types.ObjectId;
}

const ModuleSchema = new Schema<IModule>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'Pending Approval' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Module = mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);
