import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBomRevision extends Document {
  bomId: Types.ObjectId;
  revisionNumber: string;
  description?: string;
  changeReason?: string;
  status: 'Draft' | 'Released' | 'Obsolete';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BomRevisionSchema = new Schema<IBomRevision>({
  bomId: { type: Schema.Types.ObjectId, ref: 'Bom', required: true, index: true },
  revisionNumber: { type: String, required: true },
  description: { type: String, default: '' },
  changeReason: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Draft', 'Released', 'Obsolete'],
    default: 'Draft'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const BomRevision = mongoose.models.BomRevision || mongoose.model<IBomRevision>('BomRevision', BomRevisionSchema);
