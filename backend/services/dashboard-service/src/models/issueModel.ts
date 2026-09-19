import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IIssue extends Document {
  projectId: Types.ObjectId;
  issueId: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  ownerId?: Types.ObjectId;
  reportedById: Types.ObjectId;
  dueDate?: Date;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  resolution?: string;
  resolvedDate?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  issueId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  reportedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  resolution: { type: String, default: '' },
  resolvedDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Pre-save hook to generate issueId if not present
IssueSchema.pre('validate', async function(this: IIssue) {
  if (this.isNew && !this.issueId) {
    this.issueId = `ISS-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
  }
});

export const Issue = mongoose.models.Issue || mongoose.model<IIssue>('Issue', IssueSchema);
