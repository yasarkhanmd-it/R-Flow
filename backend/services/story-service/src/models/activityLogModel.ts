import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  targetType: string;
  targetId: Types.ObjectId;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true }
});

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
