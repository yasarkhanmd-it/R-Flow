import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IModule extends Document {
  projectId: Types.ObjectId;
  name: string;
  description: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed' | 'Closed';
  createdBy: Types.ObjectId;
  progress: number;
  dueDate?: Date;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'In Progress', 'Completed', 'Closed'],
      default: 'Pending Approval'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    dueDate: {
      type: Date
    },
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

ModuleSchema.index({ projectId: 1, name: 1 }, { unique: true });
ModuleSchema.index({ projectId: 1, status: 1 });
ModuleSchema.index({ createdBy: 1 });

export const Module = mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);
