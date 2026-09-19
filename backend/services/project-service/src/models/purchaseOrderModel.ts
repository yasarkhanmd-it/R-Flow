import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseOrderItem {
  bomItemId?: mongoose.Types.ObjectId; // Link to BOM item, optional if ad-hoc
  partName: string;
  quantityOrdered: number;
  unitPrice: number;
}

export interface IPurchaseOrder extends Document {
  projectId: mongoose.Types.ObjectId;
  poNumber: string;
  supplierId: mongoose.Types.ObjectId;
  status: string; // 'Draft', 'Issued', 'Partially Received', 'Fulfilled', 'Cancelled'
  totalAmount: number;
  issueDate?: Date;
  expectedDeliveryDate?: Date;
  items: IPurchaseOrderItem[];
  createdBy: mongoose.Types.ObjectId;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  bomItemId: { type: Schema.Types.ObjectId, ref: 'BomItem' },
  partName: { type: String, required: true },
  quantityOrdered: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 }
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  poNumber: { type: String, required: true, unique: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  status: { type: String, default: 'Draft' },
  totalAmount: { type: Number, default: 0 },
  issueDate: { type: Date },
  expectedDeliveryDate: { type: Date },
  items: [PurchaseOrderItemSchema],
  createdBy: { type: Schema.Types.ObjectId, required: true }
}, { timestamps: true });

export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
