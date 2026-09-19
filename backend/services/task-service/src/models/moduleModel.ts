import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IModule extends Document {
  name: string;
  projectId: Types.ObjectId;
  status: string;
}

const ModuleSchema = new Schema<IModule>({
  name: { type: String, required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, default: 'Pending Approval' }
});

export const Module = mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);
