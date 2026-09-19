import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDepartment extends Document {
  departmentName: string;
  departmentCode: string;
  description: string;
  verticalId?: Types.ObjectId;
  managerIds?: Types.ObjectId[];
  status?: string;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    departmentName: { type: String, required: true, trim: true },
    departmentCode: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    verticalId: { type: Schema.Types.ObjectId, ref: 'Vertical' },
    managerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, default: 'Active' }
  },
  { timestamps: true }
);

export const Department =
  mongoose.models.Department ||
  mongoose.model<IDepartment>('Department', DepartmentSchema);
