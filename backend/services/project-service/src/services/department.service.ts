import { departmentRepo } from '../repo/department.repository';
import { verticalRepo } from '../repo/vertical.repository';
import { Project } from '../models/projectModel';
import { User } from '../models/userModel';

// ─────────────────────────────────────────────────────────────────────────────
// Create Department
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Create Department
// ─────────────────────────────────────────────────────────────────────────────
export const createDepartment = async (
  data: {
    departmentName: string;
    departmentCode?: string;
    description?: string;
    verticalId?: string;
    managerIds?: string[];
    status?: 'Active' | 'Inactive';
  },
  createdBy: string
) => {
  let targetVerticalId = data.verticalId;
  if (!targetVerticalId || targetVerticalId === 'undefined' || targetVerticalId === 'null') {
    const verticals = await verticalRepo.findAll();
    if (verticals.length > 0) {
      targetVerticalId = (verticals[0]._id as any).toString();
    } else {
      const defaultVert = await verticalRepo.create({
        name: 'General',
        description: 'Default business vertical',
        status: 'Active',
        createdBy: createdBy as any
      });
      targetVerticalId = (defaultVert._id as any).toString();
    }
  }

  // Verify vertical exists
  const vertical = await verticalRepo.findById(targetVerticalId as string);
  if (!vertical) {
    throw Object.assign(new Error('Vertical not found.'), { statusCode: 404 });
  }

  let code = data.departmentCode;
  if (!code || !code.trim()) {
    const clean = data.departmentName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    code = `${clean.substring(0, 4) || 'DEPT'}-${Math.floor(100 + Math.random() * 900)}`;
  }

  // Check name uniqueness in this vertical
  const existingName = await departmentRepo.findByNameInVertical(data.departmentName.trim(), targetVerticalId as string);
  if (existingName) {
    throw Object.assign(
      new Error(`Department name "${data.departmentName}" already exists.`),
      { statusCode: 409 }
    );
  }

  // Validate managerIds
  const managerIds: string[] = [];
  if (Array.isArray(data.managerIds) && data.managerIds.length > 0) {
    for (const mId of data.managerIds) {
      if (mId && mId !== 'undefined' && mId !== 'null' && /^[0-9a-fA-F]{24}$/.test(mId)) {
        managerIds.push(mId);
      }
    }
  }

  const dept = await departmentRepo.create({
    departmentName: data.departmentName.trim(),
    departmentCode: code.toUpperCase().trim(),
    description: data.description?.trim() || '',
    verticalId: targetVerticalId as any,
    managerIds: managerIds as any,
    status: data.status || 'Active',
    createdBy: createdBy as any
  });

  return dept;
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Departments with Role-Based Filtering
// ─────────────────────────────────────────────────────────────────────────────
export const getDepartments = async (user: { id: string; role: string; superAdmin?: boolean }) => {
  const isAdminLevel = user.superAdmin || user.role === 'Administrator';
  const departments = isAdminLevel
    ? await departmentRepo.findAll()
    : user.role === 'Manager'
      ? await departmentRepo.findByManagerId(user.id)
      : await departmentRepo.findAll();

  const { Task } = require('../models/taskModel');

  const enriched = await Promise.all(
    departments.map(async (dept) => {
      const deptId = dept._id;

      // Projects linked to department
      const deptProjects = await Project.find({
        $or: [{ departmentIds: deptId }, { departmentId: deptId }]
      }, { _id: 1 }).lean();
      const projIds = deptProjects.map(p => p._id);
      const projectCount = deptProjects.length;

      // Tasks count across project tasks & department tasks
      let taskCount = 0;
      try {
        taskCount = await Task.countDocuments({
          $or: [{ departmentId: deptId }, { projectId: { $in: projIds } }]
        });
      } catch (err) {
        taskCount = 0;
      }

      // Resources/Users assigned to department
      const resourceCount = await User.countDocuments({ departmentId: deptId });

      return {
        ...dept.toObject(),
        projectCount,
        taskCount,
        resourceCount,
        employeeCount: resourceCount
      };
    })
  );

  return enriched;
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Department by ID with Stats
// ─────────────────────────────────────────────────────────────────────────────
export const getDepartmentById = async (id: string) => {
  const dept = await departmentRepo.findById(id);
  if (!dept) {
    throw Object.assign(new Error('Department not found.'), { statusCode: 404 });
  }

  const deptId = dept._id;
  const { Task } = require('../models/taskModel');

  const deptProjects = await Project.find({
    $or: [{ departmentIds: deptId }, { departmentId: deptId }]
  }, { _id: 1 }).lean();
  const projIds = deptProjects.map(p => p._id);

  const [projectCount, resourceCount, taskCount] = await Promise.all([
    deptProjects.length,
    User.countDocuments({ departmentId: deptId }),
    Task.countDocuments({ $or: [{ departmentId: deptId }, { projectId: { $in: projIds } }] }).catch(() => 0)
  ]);

  return {
    ...dept.toObject(),
    projectCount,
    taskCount,
    resourceCount,
    employeeCount: resourceCount
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Update Department
// ─────────────────────────────────────────────────────────────────────────────
export const updateDepartment = async (
  id: string,
  data: Partial<{
    departmentName: string;
    departmentCode: string;
    description: string;
    status: 'Active' | 'Inactive';
  }>
) => {
  const existing = await departmentRepo.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Department not found.'), { statusCode: 404 });
  }

  const verticalId = (existing.verticalId as any)?._id?.toString() || existing.verticalId?.toString();

  // Validate name uniqueness within this Vertical (if changing)
  if (data.departmentName && data.departmentName !== existing.departmentName) {
    const conflict = await departmentRepo.findByNameInVertical(data.departmentName, verticalId);
    if (conflict && conflict._id.toString() !== id) {
      throw Object.assign(
        new Error(`Department name "${data.departmentName}" already exists.`),
        { statusCode: 409 }
      );
    }
  }

  if (data.departmentCode) {
    data.departmentCode = data.departmentCode.toUpperCase();
  }

  return departmentRepo.update(id, data as any);
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete Department
// ─────────────────────────────────────────────────────────────────────────────
export const deleteDepartment = async (id: string) => {
  const existing = await departmentRepo.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Department not found.'), { statusCode: 404 });
  }

  // Clear departmentId from all users in this department
  await User.updateMany({ departmentId: id }, { $unset: { departmentId: '' } });
  await Project.updateMany({ departmentIds: id }, { $pull: { departmentIds: id } });

  return departmentRepo.delete(id);
};

// ─────────────────────────────────────────────────────────────────────────────
// Assign Manager(s) — supports adding or setting managers on a department
// ─────────────────────────────────────────────────────────────────────────────
export const assignManagers = async (departmentId: string, managerIds: string[]) => {
  const dept = await departmentRepo.findById(departmentId);
  if (!dept) {
    throw Object.assign(new Error('Department not found.'), { statusCode: 404 });
  }

  // Validate each manager
  for (const mId of managerIds) {
    const manager = await User.findById(mId);
    if (!manager) {
      throw Object.assign(new Error(`User ${mId} not found.`), { statusCode: 404 });
    }
    if (manager.role !== 'Manager') {
      throw Object.assign(
        new Error(`User "${manager.employeeName}" does not have the Manager role.`),
        { statusCode: 400 }
      );
    }
  }

  return departmentRepo.update(departmentId, { managerIds: managerIds as any });
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Department Projects
// ─────────────────────────────────────────────────────────────────────────────
export const getDepartmentProjects = async (departmentId: string) => {
  const dept = await departmentRepo.findById(departmentId);
  if (!dept) {
    throw Object.assign(new Error('Department not found.'), { statusCode: 404 });
  }

  return Project.find({ departmentIds: departmentId })
    .populate('managerId', 'employeeName')
    .populate('leadId', 'employeeName')
    .populate('members', 'employeeName')
    .populate('verticalId', 'name')
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Department Users
// ─────────────────────────────────────────────────────────────────────────────
export const getDepartmentUsers = async (departmentId: string) => {
  const dept = await departmentRepo.findById(departmentId);
  if (!dept) {
    throw Object.assign(new Error('Department not found.'), { statusCode: 404 });
  }

  return User.find({ departmentId })
    .select('employeeName employeeId email role status')
    .sort({ role: 1, employeeName: 1 });
};
