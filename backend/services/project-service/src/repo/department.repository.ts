import { Department, IDepartment } from '../models/department.model';
import { Types } from 'mongoose';

export const departmentRepo = {

  async findAll(): Promise<IDepartment[]> {
    return Department.find({})
      .populate('managerIds', 'employeeName employeeId email')
      .populate('verticalId', 'name')
      .sort({ departmentName: 1 })
      .exec();
  },

  async findByVerticalId(verticalId: string): Promise<IDepartment[]> {
    return Department.find({ verticalId })
      .populate('managerIds', 'employeeName employeeId email')
      .sort({ departmentName: 1 })
      .exec();
  },

  async findByManagerId(managerId: string): Promise<IDepartment[]> {
    return Department.find({ managerIds: managerId })
      .populate('managerIds', 'employeeName employeeId email')
      .populate('verticalId', 'name')
      .sort({ departmentName: 1 })
      .exec();
  },

  async findById(id: string): Promise<IDepartment | null> {
    return Department.findById(id)
      .populate('managerIds', 'employeeName employeeId email')
      .populate('verticalId', 'name')
      .exec();
  },

  // Uniqueness check scoped to a specific Vertical
  async findByNameInVertical(name: string, verticalId: string): Promise<IDepartment | null> {
    return Department.findOne({
      verticalId,
      departmentName: { $regex: new RegExp(`^${name}$`, 'i') }
    }).exec();
  },

  // Code uniqueness check scoped to a specific Vertical
  async findByCodeInVertical(code: string, verticalId: string): Promise<IDepartment | null> {
    return Department.findOne({
      verticalId,
      departmentCode: code.toUpperCase()
    }).exec();
  },

  async create(data: Partial<IDepartment>): Promise<IDepartment> {
    const dept = new Department(data);
    return dept.save();
  },

  async update(id: string, data: Partial<IDepartment>): Promise<IDepartment | null> {
    return Department.findByIdAndUpdate(id, data, { new: true })
      .populate('managerIds', 'employeeName employeeId email')
      .populate('verticalId', 'name')
      .exec();
  },

  async delete(id: string): Promise<IDepartment | null> {
    return Department.findByIdAndDelete(id).exec();
  },

  async count(): Promise<number> {
    return Department.countDocuments({}).exec();
  }
};
