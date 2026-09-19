import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDepartment extends Document {
  departmentName: string;
  departmentCode: string;
  description: string;
  verticalId: Types.ObjectId;
  managerIds: Types.ObjectId[];
  status: 'Active' | 'Inactive';
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    departmentName: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true
      // NOT globally unique — same name can exist under different Verticals
    },
    departmentCode: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true
      // NOT globally unique — unique per Vertical (compound index below)
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    verticalId: {
      type: Schema.Types.ObjectId,
      ref: 'Vertical',
      required: [true, 'Vertical reference is required']
    },
    managerIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
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

// Code unique per vertical (not globally)
DepartmentSchema.index({ verticalId: 1, departmentCode: 1 }, { unique: true });
DepartmentSchema.index({ verticalId: 1 });
DepartmentSchema.index({ managerIds: 1 });
DepartmentSchema.index({ verticalId: 1, departmentName: 1 });
DepartmentSchema.index({ status: 1 });

export const Department =
  mongoose.models.Department ||
  mongoose.model<IDepartment>('Department', DepartmentSchema);
