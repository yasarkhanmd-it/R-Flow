import mongoose, { Document, Schema, Types } from 'mongoose';
import './userModel';

export interface IProject extends Document {
  name: string;
  description: string;
  managerId: Types.ObjectId;
  members: Types.ObjectId[];
  status: string;
  leadId?: Types.ObjectId;
  assignedDate?: Date;
  expectedEndDate?: Date;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, default: 'Active' },
  leadId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedDate: { type: Date },
  expectedEndDate: { type: Date },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
