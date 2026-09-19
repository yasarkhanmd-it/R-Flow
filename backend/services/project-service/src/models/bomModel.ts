import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBom extends Document {
  projectId: Types.ObjectId;
  bomNumber: string;
  revision?: string;
  titleAssembly?: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Released' | 'On Hold' | 'Pending';
  currentRevisionId?: Types.ObjectId;
  ownerId: Types.ObjectId;
  releasedBy?: string;
  releaseDate?: Date;
  vendorSupplier?: string;
  deliveryStatus?: 'Pending' | 'Ordered' | 'Partially Delivered' | 'Delivered';
  expectedDelivery?: Date;
  actualDelivery?: Date;
  estimatedCost?: number;
  actualCost?: number;
  lineItemsCount?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BomSchema = new Schema<IBom>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  bomNumber: { type: String, required: true },
  revision: { type: String, default: 'A' },
  titleAssembly: { type: String, default: '' },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Draft', 'Released', 'On Hold', 'Pending'],
    default: 'Draft'
  },
  currentRevisionId: { type: Schema.Types.ObjectId, ref: 'BomRevision' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  releasedBy: { type: String, default: '' },
  releaseDate: { type: Date, default: null },
  vendorSupplier: { type: String, default: '' },
  deliveryStatus: {
    type: String,
    enum: ['Pending', 'Ordered', 'Partially Delivered', 'Delivered'],
    default: 'Pending'
  },
  expectedDelivery: { type: Date, default: null },
  actualDelivery: { type: Date, default: null },
  estimatedCost: { type: Number, default: 0 },
  actualCost: { type: Number, default: 0 },
  lineItemsCount: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

BomSchema.pre('validate', async function(this: IBom) {
  if (this.isNew && !this.bomNumber) {
    this.bomNumber = `BOM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
  }
});

export const Bom = mongoose.models.Bom || mongoose.model<IBom>('Bom', BomSchema);
