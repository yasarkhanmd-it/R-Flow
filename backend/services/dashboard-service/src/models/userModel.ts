import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  employeeName: string;
}

const UserSchema = new Schema<IUser>({
  employeeName: { type: String, required: true }
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
