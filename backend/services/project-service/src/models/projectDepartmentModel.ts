import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProjectDepartment extends Document {
  projectId: Types.ObjectId;
  departmentId: Types.ObjectId;
  addedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProjectDepartmentSchema = new Schema<IProjectDepartment>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required']
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Ensure a department can only be linked once per project
ProjectDepartmentSchema.index({ projectId: 1, departmentId: 1 }, { unique: true });
ProjectDepartmentSchema.index({ projectId: 1 });
ProjectDepartmentSchema.index({ departmentId: 1 });

export const ProjectDepartment =
  mongoose.models.ProjectDepartment ||
  mongoose.model<IProjectDepartment>('ProjectDepartment', ProjectDepartmentSchema);
