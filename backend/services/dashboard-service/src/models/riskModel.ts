import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRisk extends Document {
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Identified' | 'Open' | 'Mitigated' | 'Closed' | 'Realized';
  mitigationPlan?: string;
  ownerId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RiskSchema = new Schema<IRisk>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  probability: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  impact: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Identified', 'Open', 'Mitigated', 'Closed', 'Realized'],
    default: 'Identified'
  },
  mitigationPlan: { type: String, default: '' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Risk = mongoose.models.Risk || mongoose.model<IRisk>('Risk', RiskSchema);
