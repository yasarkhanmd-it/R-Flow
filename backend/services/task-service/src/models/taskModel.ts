import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  projectId: Types.ObjectId;
  moduleId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  workflowStageId?: Types.ObjectId;
  taskId: string;
  summary: string;
  description: string;
  type: 'Story' | 'Task' | 'Bug' | 'Epic' | 'Sub-task';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Blocked' | 'Completed' | 'Pending Review' | 'Done';
  estimatedHours?: number;
  actualHours?: number;
  assigneeId?: Types.ObjectId;
  reporterId: Types.ObjectId;
  startDate?: Date;
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module'
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    workflowStageId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowStage',
      default: null
    },
    taskId: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    summary: {
      type: String,
      required: [true, 'Task summary is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    type: {
      type: String,
      enum: ['Story', 'Task', 'Bug', 'Epic', 'Sub-task'],
      default: 'Task'
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Blocked', 'Completed', 'Pending Review', 'Done'],
      default: 'To Do'
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date
    },
    dueDate: {
      type: Date
    }
  },
  { timestamps: true }
);

TaskSchema.index({ projectId: 1, createdAt: -1 });
TaskSchema.index({ moduleId: 1, createdAt: -1 });
TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ reporterId: 1 });
TaskSchema.index({ projectId: 1, moduleId: 1, status: 1 });
TaskSchema.index({ projectId: 1, moduleId: 1, createdAt: -1 });
TaskSchema.index({ summary: 'text', taskId: 'text' });
TaskSchema.index({ dueDate: 1, status: 1 });

export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
