import mongoose, { Schema, Document, Types } from 'mongoose';

// User Schema
export interface IUser extends Document {
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  role: string;
  superAdmin?: boolean;
}
const UserSchema = new Schema<IUser>({
  employeeName: String,
  employeeId: String,
  email: String,
  department: String,
  role: String,
  superAdmin: Boolean
}, { timestamps: true });
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Vertical Schema
export interface IVertical extends Document {
  name: string;
  description?: string;
  status: string;
}
const VerticalSchema = new Schema<IVertical>({
  name: String,
  description: String,
  status: String
}, { timestamps: true });
export const Vertical = mongoose.models.Vertical || mongoose.model<IVertical>('Vertical', VerticalSchema);

// Department Schema
export interface IDepartment extends Document {
  departmentName: string;
  departmentCode: string;
  verticalId?: Types.ObjectId;
  managerIds?: Types.ObjectId[];
  status: string;
}
const DepartmentSchema = new Schema<IDepartment>({
  departmentName: String,
  departmentCode: String,
  verticalId: { type: Schema.Types.ObjectId, ref: 'Vertical' },
  managerIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: String
}, { timestamps: true });
export const Department = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);

// Project Schema
export interface IProject extends Document {
  name: string;
  projectCode?: string;
  description?: string;
  verticalId?: Types.ObjectId;
  departmentIds?: Types.ObjectId[];
  managerId: Types.ObjectId;
  leadId?: Types.ObjectId;
  members: Types.ObjectId[];
  status: string;
  health?: string;
  startDate?: Date;
  expectedEndDate?: Date;
  budget?: number;
}
const ProjectSchema = new Schema<IProject>({
  name: String,
  projectCode: String,
  description: String,
  verticalId: { type: Schema.Types.ObjectId, ref: 'Vertical' },
  departmentIds: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  leadId: { type: Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: String,
  health: String,
  startDate: Date,
  expectedEndDate: Date,
  budget: Number
}, { timestamps: true });
export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

// Task Schema
export interface ITask extends Document {
  projectId: Types.ObjectId;
  taskId: string;
  summary: string;
  type: string;
  priority: string;
  status: string;
  estimatedHours?: number;
  actualHours?: number;
  assigneeId?: Types.ObjectId;
  dueDate?: Date;
}
const TaskSchema = new Schema<ITask>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  taskId: String,
  summary: String,
  type: String,
  priority: String,
  status: String,
  estimatedHours: Number,
  actualHours: Number,
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date
}, { timestamps: true });
export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

// Milestone Schema
export interface IMilestone extends Document {
  projectId: Types.ObjectId;
  name: string;
  status: string;
  plannedEnd?: Date;
  actualEnd?: Date;
  progress?: number;
}
const MilestoneSchema = new Schema<IMilestone>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  name: String,
  status: String,
  plannedEnd: Date,
  actualEnd: Date,
  progress: Number
}, { timestamps: true });
export const Milestone = mongoose.models.Milestone || mongoose.model<IMilestone>('Milestone', MilestoneSchema);

// Risk Schema
export interface IRisk extends Document {
  projectId: Types.ObjectId;
  title: string;
  severity: string;
  status: string;
}
const RiskSchema = new Schema<IRisk>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  title: String,
  severity: String,
  status: String
}, { timestamps: true });
export const Risk = mongoose.models.Risk || mongoose.model<IRisk>('Risk', RiskSchema);

// Issue Schema
export interface IIssue extends Document {
  projectId: Types.ObjectId;
  issueId: string;
  title: string;
  severity: string;
  status: string;
}
const IssueSchema = new Schema<IIssue>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  issueId: String,
  title: String,
  severity: String,
  status: String
}, { timestamps: true });
export const Issue = mongoose.models.Issue || mongoose.model<IIssue>('Issue', IssueSchema);

// BOM Schema
export interface IBom extends Document {
  projectId: Types.ObjectId;
  bomNumber: string;
  name: string;
  status: string;
}
const BomSchema = new Schema<IBom>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  bomNumber: String,
  name: String,
  status: String
}, { timestamps: true });
export const Bom = mongoose.models.Bom || mongoose.model<IBom>('Bom', BomSchema);

// BOM Item Schema
export interface IBomItem extends Document {
  bomId: Types.ObjectId;
  projectId: Types.ObjectId;
  partNumber: string;
  quantity: number;
  unitCost: number;
}
const BomItemSchema = new Schema<IBomItem>({
  bomId: { type: Schema.Types.ObjectId, ref: 'Bom' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  partNumber: String,
  quantity: Number,
  unitCost: Number
}, { timestamps: true });
export const BomItem = mongoose.models.BomItem || mongoose.model<IBomItem>('BomItem', BomItemSchema);

// Transaction Schema
export interface ITransaction extends Document {
  projectId: Types.ObjectId;
  amount: number;
  type: 'Inflow' | 'Outflow';
  status: string;
  category: string;
}
const TransactionSchema = new Schema<ITransaction>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  amount: Number,
  type: String,
  status: String,
  category: String
}, { timestamps: true });
export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

// Resource Allocation Schema
export interface IResourceAllocation extends Document {
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  projectRole: string;
  allocationPercentage: number;
  status: string;
}
const ResourceAllocationSchema = new Schema<IResourceAllocation>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  projectRole: String,
  allocationPercentage: Number,
  status: String
}, { timestamps: true });
export const ResourceAllocation = mongoose.models.ResourceAllocation || mongoose.model<IResourceAllocation>('ResourceAllocation', ResourceAllocationSchema);

// WorkLog Schema
export interface IWorkLog extends Document {
  taskId: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  hoursLogged: number;
  workDate: Date;
}
const WorkLogSchema = new Schema<IWorkLog>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  hoursLogged: Number,
  workDate: Date
}, { timestamps: true });
export const WorkLog = mongoose.models.WorkLog || mongoose.model<IWorkLog>('WorkLog', WorkLogSchema);
