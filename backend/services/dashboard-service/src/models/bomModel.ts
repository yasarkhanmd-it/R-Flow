import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBom extends Document {
  projectId: Types.ObjectId;
  bomNumber: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Released' | 'On Hold';
  currentRevisionId?: Types.ObjectId;
  ownerId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BomSchema = new Schema<IBom>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  bomNumber: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Draft', 'Released', 'On Hold'],
    default: 'Draft'
  },
  currentRevisionId: { type: Schema.Types.ObjectId, ref: 'BomRevision' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

BomSchema.pre('validate', async function(this: IBom) {
  if (this.isNew && !this.bomNumber) {
    this.bomNumber = `BOM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
  }
});

export const Bom = mongoose.models.Bom || mongoose.model<IBom>('Bom', BomSchema);
