import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChangeRequest extends Document {
  projectId: Types.ObjectId;
  crId: string;
  title: string;
  description?: string;
  requestedById: Types.ObjectId;
  ownerId?: Types.ObjectId;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reason?: string;
  scopeImpact?: string;
  costImpact?: string;
  scheduleImpact?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  status: 'Open' | 'In Review' | 'Approved' | 'Rejected' | 'Implementing' | 'Completed' | 'Closed';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChangeRequestSchema = new Schema<IChangeRequest>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  crId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  requestedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  reason: { type: String, default: '' },
  scopeImpact: { type: String, default: '' },
  costImpact: { type: String, default: '' },
  scheduleImpact: { type: String, default: '' },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Open', 'In Review', 'Approved', 'Rejected', 'Implementing', 'Completed', 'Closed'],
    default: 'Open'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Pre-save hook to generate crId if not present
ChangeRequestSchema.pre('validate', async function(this: IChangeRequest) {
  if (this.isNew && !this.crId) {
    this.crId = `CR-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
  }
});

export const ChangeRequest = mongoose.models.ChangeRequest || mongoose.model<IChangeRequest>('ChangeRequest', ChangeRequestSchema);
