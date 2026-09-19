import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  status: string; // 'Active', 'Inactive'
  createdBy: mongoose.Types.ObjectId;
}

const SupplierSchema = new Schema<ISupplier>({
  name: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  address: { type: String },
  status: { type: String, default: 'Active' },
  createdBy: { type: Schema.Types.ObjectId, required: true }
}, { timestamps: true });

export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
