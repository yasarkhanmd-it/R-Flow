import mongoose, { Document, Schema, Types } from 'mongoose';
import './userModel';

export interface IProject extends Document {
  name: string;
  description: string;
  projectCode?: string;
  verticalId?: Types.ObjectId;
  departmentIds: Types.ObjectId[];
  departmentId?: Types.ObjectId;   // Legacy alias — kept for backward compat during migration
  managerId: Types.ObjectId;
  members: Types.ObjectId[];
  status: 'Assigned' | 'Pending Acceptance' | 'Accepted' | 'Rejected' | 'Active' | 'Completed' | 'On Hold' | 'Cancelled';
  leadId?: Types.ObjectId;
  startDate?: Date;
  assignedDate?: Date;
  expectedEndDate?: Date;
  rejectionReason?: string;
  budget?: number;
  teamSize?: number;
  hoursAllocated?: number;
  hoursUsed?: number;
  actualCost?: number;
  committedCost?: number;
  retentionHoldback?: number;
  revenue?: number;
  otherCashInflow?: number;
  otherCashOutflow?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    projectCode: {
      type: String,
      trim: true,
      default: null
    },
    verticalId: {
      type: Schema.Types.ObjectId,
      ref: 'Vertical',
      default: null
    },
    departmentIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Department'
    }],
    // Legacy field — kept for backward compat; migrated to departmentIds[] on startup
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: {
      type: String,
      enum: ['Assigned', 'Pending Acceptance', 'Accepted', 'Rejected', 'Active', 'Completed', 'On Hold', 'Cancelled'],
      default: 'Active'
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: {
      type: Date,
      default: null
    },
    assignedDate: {
      type: Date
    },
    expectedEndDate: {
      type: Date
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    budget: {
      type: Number,
      default: 0
    },
    teamSize: {
      type: Number,
      default: 0
    },
    hoursAllocated: {
      type: Number,
      default: 0
    },
    hoursUsed: {
      type: Number,
      default: 0
    },
    actualCost: {
      type: Number,
      default: 0
    },
    committedCost: {
      type: Number,
      default: 0
    },
    retentionHoldback: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    otherCashInflow: {
      type: Number,
      default: 0
    },
    otherCashOutflow: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

ProjectSchema.index({ verticalId: 1 });
ProjectSchema.index({ departmentIds: 1 });
ProjectSchema.index({ departmentId: 1 });
ProjectSchema.index({ managerId: 1 });
ProjectSchema.index({ leadId: 1 });
ProjectSchema.index({ members: 1 });
ProjectSchema.index({ status: 1, createdAt: -1 });

export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
