import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  targetType: string;
  targetId: Types.ObjectId;
  action: string;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, required: true }
}, { timestamps: true });

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
