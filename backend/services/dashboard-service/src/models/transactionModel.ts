import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITransaction extends Document {
  projectId: Types.ObjectId;
  description: string;
  amount: number;
  type: 'Inflow' | 'Outflow';
  category: string;
  date: Date;
  status: 'Planned' | 'Pending' | 'Completed';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  type: {
    type: String,
    enum: ['Inflow', 'Outflow'],
    required: true
  },
  category: { type: String, default: 'General' },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Planned', 'Pending', 'Completed'],
    default: 'Planned'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
