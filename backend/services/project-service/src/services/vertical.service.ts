import { verticalRepo } from '../repo/vertical.repository';
import { Department } from '../models/department.model';
import { User } from '../models/userModel';

// ─────────────────────────────────────────────────────────────────────────────
// Create Vertical
// ─────────────────────────────────────────────────────────────────────────────
export const createVertical = async (
  data: { name: string; description?: string; status?: 'Active' | 'Inactive' },
  createdBy: string
) => {
  const existing = await verticalRepo.findByName(data.name);
  if (existing) {
    throw Object.assign(new Error('Vertical name already exists.'), { statusCode: 409 });
  }

  return verticalRepo.create({
    name: data.name.trim(),
    description: data.description?.trim() || '',
    status: data.status || 'Active',
    createdBy: createdBy as any
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Verticals with Role-Based Filtering
// ─────────────────────────────────────────────────────────────────────────────
export const getVerticals = async (user: { id: string; role: string; superAdmin?: boolean }) => {
  const isAdminLevel = user.superAdmin || user.role === 'Administrator';

  let verticals = await verticalRepo.findAll();

  // Managers see only verticals where they are assigned to at least one department
  if (!isAdminLevel && user.role === 'Manager') {
    const managedDepts = await Department.find(
      { managerIds: user.id },
      { verticalId: 1 }
    ).lean();
    const verticalIds = [...new Set(managedDepts.map(d => d.verticalId?.toString()).filter(Boolean))];
    verticals = verticals.filter(v => verticalIds.includes((v._id as any).toString()));
  }

  const { Project } = require('../models/projectModel');

  // Enrich with department count, project count, and total budget
  const enriched = await Promise.all(
    verticals.map(async (v) => {
      const vId = v._id;
      const [departmentCount, vProjects] = await Promise.all([
        Department.countDocuments({ verticalId: vId }),
        Project.find({ verticalId: vId }, { budget: 1 }).lean()
      ]);

      const projectCount = vProjects.length;
      const totalBudget = vProjects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

      return {
        ...v.toObject(),
        departmentCount,
        projectCount,
        totalBudget
      };
    })
  );

  return enriched;
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Vertical by ID
// ─────────────────────────────────────────────────────────────────────────────
export const getVerticalById = async (id: string) => {
  const vertical = await verticalRepo.findById(id);
  if (!vertical) {
    throw Object.assign(new Error('Vertical not found.'), { statusCode: 404 });
  }

  const { Project } = require('../models/projectModel');
  const [departmentCount, vProjects] = await Promise.all([
    Department.countDocuments({ verticalId: id }),
    Project.find({ verticalId: id }, { budget: 1 }).lean()
  ]);

  const projectCount = vProjects.length;
  const totalBudget = vProjects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);

  return { ...vertical.toObject(), departmentCount, projectCount, totalBudget };
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Departments for a Vertical (role-filtered)
// ─────────────────────────────────────────────────────────────────────────────
export const getVerticalDepartments = async (
  verticalId: string,
  user: { id: string; role: string; superAdmin?: boolean }
) => {
  const vertical = await verticalRepo.findById(verticalId);
  if (!vertical) {
    throw Object.assign(new Error('Vertical not found.'), { statusCode: 404 });
  }

  const isAdminLevel = user.superAdmin || user.role === 'Administrator';

  const query: any = { verticalId };
  if (!isAdminLevel && user.role === 'Manager') {
    query.managerIds = user.id;
  }

  const departments = await Department.find(query)
    .populate('managerIds', 'employeeName employeeId email')
    .sort({ departmentName: 1 })
    .lean();

  // Enrich with user and project counts
  const { Project } = require('../models/projectModel');

  const enriched = await Promise.all(
    departments.map(async (dept: any) => {
      const [projectCount, userCount] = await Promise.all([
        Project.countDocuments({ $or: [{ departmentIds: dept._id }, { departmentId: dept._id }] }),
        User.countDocuments({ departmentId: dept._id })
      ]);
      return { ...dept, projectCount, userCount };
    })
  );

  return enriched;
};

// ─────────────────────────────────────────────────────────────────────────────
// Update Vertical
// ─────────────────────────────────────────────────────────────────────────────
export const updateVertical = async (
  id: string,
  data: Partial<{ name: string; description: string; status: 'Active' | 'Inactive' }>
) => {
  const existing = await verticalRepo.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Vertical not found.'), { statusCode: 404 });
  }

  if (data.name && data.name !== existing.name) {
    const conflict = await verticalRepo.findByName(data.name);
    if (conflict) {
      throw Object.assign(new Error('Vertical name already exists.'), { statusCode: 409 });
    }
  }

  if (data.name) data.name = data.name.trim();
  if (data.description !== undefined) data.description = data.description.trim();

  return verticalRepo.update(id, data as any);
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete Vertical
// ─────────────────────────────────────────────────────────────────────────────
export const deleteVertical = async (id: string) => {
  const existing = await verticalRepo.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Vertical not found.'), { statusCode: 404 });
  }

  const { Project } = require('../models/projectModel');
  await Project.updateMany({ verticalId: id }, { $unset: { verticalId: '' } });

  return verticalRepo.delete(id);
};
