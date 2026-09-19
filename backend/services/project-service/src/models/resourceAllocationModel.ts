import mongoose, { Schema, Document } from 'mongoose';

export interface IResourceAllocation extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  projectRole: string;
  allocationPercentage: number;
  startDate?: Date;
  endDate?: Date;
  status: string;
}

const ResourceAllocationSchema: Schema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  projectRole: { type: String, default: 'Team Member' },
  allocationPercentage: { type: Number, default: 100 },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, {
  timestamps: true
});

export const ResourceAllocation = mongoose.model<IResourceAllocation>('ResourceAllocation', ResourceAllocationSchema);
