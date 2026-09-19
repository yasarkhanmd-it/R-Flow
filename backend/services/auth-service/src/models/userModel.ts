import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  departmentId?: Types.ObjectId;
  verticalId?: Types.ObjectId;
  phone?: string;
  password?: string;
  role: 'User' | 'Lead' | 'Manager' | 'Administrator';
  superAdmin?: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
  // Password reset OTP fields
  resetOtp?: string;
  resetOtpExpiry?: Date;
  otpVerified?: boolean;
  otpAttempts?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    employeeName: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
      minlength: [2, 'Employee name must be at least 2 characters'],
      maxlength: [100, 'Employee name cannot exceed 100 characters']
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    email: {
      type: String,
      required: [true, 'Office email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    verticalId: {
      type: Schema.Types.ObjectId,
      ref: 'Vertical',
      default: null
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false
    },
    resetOtp: {
      type: String,
      select: false
    },
    resetOtpExpiry: {
      type: Date,
      select: false
    },
    otpVerified: {
      type: Boolean,
      default: false,
      select: false
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    role: {
      type: String,
      enum: ['User', 'Lead', 'Manager', 'Administrator'],
      default: 'User'
    },
    superAdmin: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
      default: 'Approved'
    }
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.password;
    delete ret.resetOtp;
    delete ret.resetOtpExpiry;
    delete ret.otpVerified;
    delete ret.otpAttempts;
    delete ret.__v;
    return ret;
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);
