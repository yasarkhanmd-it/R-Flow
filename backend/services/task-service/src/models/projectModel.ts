import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  managerId: Types.ObjectId;
  members: Types.ObjectId[];
  leadId?: Types.ObjectId;
  status?: string;
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  leadId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String }
});

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
