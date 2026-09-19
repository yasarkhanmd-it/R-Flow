import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBomItem extends Document {
  revisionId: Types.ObjectId;
  partNumber: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
  make: string;
  vendor: string;
  unitCost: number;
  totalCost: number;
  deliveryStatus: 'Pending' | 'Ordered' | 'Partially Delivered' | 'Delivered';
  inspectionStatus: 'Not Inspected' | 'Passed' | 'Rework' | 'Rejected';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BomItemSchema = new Schema<IBomItem>({
  revisionId: { type: Schema.Types.ObjectId, ref: 'BomRevision', required: true, index: true },
  partNumber: { type: String, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'pcs' },
  category: { type: String, default: '' },
  make: { type: String, default: '' },
  vendor: { type: String, default: '' },
  unitCost: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, default: 0 },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Ordered', 'Partially Delivered', 'Delivered'],
    default: 'Pending'
  },
  inspectionStatus: {
    type: String,
    enum: ['Not Inspected', 'Passed', 'Rework', 'Rejected'],
    default: 'Not Inspected'
  },
  remarks: { type: String, default: '' }
}, { timestamps: true });

BomItemSchema.pre('save', async function(this: IBomItem) {
  this.totalCost = (this.quantity || 0) * (this.unitCost || 0);
});

export const BomItem = mongoose.models.BomItem || mongoose.model<IBomItem>('BomItem', BomItemSchema);
