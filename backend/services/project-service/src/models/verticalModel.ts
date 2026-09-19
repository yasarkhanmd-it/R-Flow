import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVertical extends Document {
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const VerticalSchema = new Schema<IVertical>(
  {
    name: {
      type: String,
      required: [true, 'Vertical name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

VerticalSchema.index({ status: 1 });

export const Vertical =
  mongoose.models.Vertical ||
  mongoose.model<IVertical>('Vertical', VerticalSchema);
