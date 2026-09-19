import mongoose, { Document, Schema } from 'mongoose';

export interface IGoodsReceiptItem {
  poItemId: mongoose.Types.ObjectId; // Needs to map back to the PO item
  quantityReceived: number;
  condition?: string;
}

export interface IGoodsReceipt extends Document {
  poId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  receiptNumber: string;
  receiptDate: Date;
  status: string; // 'Draft', 'Confirmed'
  items: IGoodsReceiptItem[];
  receivedBy: mongoose.Types.ObjectId;
}

const GoodsReceiptItemSchema = new Schema<IGoodsReceiptItem>({
  poItemId: { type: Schema.Types.ObjectId, required: true },
  quantityReceived: { type: Number, required: true, min: 1 },
  condition: { type: String }
});

const GoodsReceiptSchema = new Schema<IGoodsReceipt>({
  poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  receiptNumber: { type: String, required: true, unique: true },
  receiptDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Confirmed' },
  items: [GoodsReceiptItemSchema],
  receivedBy: { type: Schema.Types.ObjectId, required: true }
}, { timestamps: true });

export const GoodsReceipt = mongoose.models.GoodsReceipt || mongoose.model<IGoodsReceipt>('GoodsReceipt', GoodsReceiptSchema);
