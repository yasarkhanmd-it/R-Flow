import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  departmentId?: Types.ObjectId;
  verticalId?: Types.ObjectId;
  role: string;
  status: string;
  superAdmin?: boolean;
}

const UserSchema = new Schema<IUser>({
  employeeName: { type: String, required: true },
  employeeId: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
  verticalId: { type: Schema.Types.ObjectId, ref: 'Vertical', default: null },
  role: { type: String, default: 'User' },
  status: { type: String, default: 'Approved' },
  superAdmin: { type: Boolean, default: false }
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

