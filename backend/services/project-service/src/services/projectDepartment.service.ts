import { ProjectDepartment } from '../models/projectDepartmentModel';
import { Project } from '../models/projectModel';
import { Department } from '../models/department.model';

// ─────────────────────────────────────────────────────────────────────────────
// Get all departments linked to a project
// ─────────────────────────────────────────────────────────────────────────────
export const getProjectDepartments = async (projectId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw Object.assign(new Error('Project not found.'), { statusCode: 404 });
  }

  return ProjectDepartment.find({ projectId })
    .populate({
      path: 'departmentId',
      select: 'departmentName departmentCode verticalId managerIds',
      populate: [
        { path: 'verticalId', select: 'name' },
        { path: 'managerIds', select: 'employeeName email' }
      ]
    })
    .sort({ addedAt: 1 })
    .lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// Add a department to a project
// ─────────────────────────────────────────────────────────────────────────────
export const addDepartmentToProject = async (
  projectId: string,
  departmentId: string
) => {
  const [project, dept] = await Promise.all([
    Project.findById(projectId),
    Department.findById(departmentId).lean()
  ]);

  if (!project) throw Object.assign(new Error('Project not found.'), { statusCode: 404 });
  if (!dept) throw Object.assign(new Error('Department not found.'), { statusCode: 404 });

  // Check if already linked
  const existing = await ProjectDepartment.findOne({ projectId, departmentId });
  if (existing) {
    throw Object.assign(
      new Error('Department is already linked to this project.'),
      { statusCode: 409 }
    );
  }

  const link = new ProjectDepartment({
    projectId,
    departmentId,
    addedAt: new Date()
  });

  const saved = await link.save();

  return ProjectDepartment.findById(saved._id).populate({
    path: 'departmentId',
    select: 'departmentName departmentCode verticalId managerIds',
    populate: [
      { path: 'verticalId', select: 'name' },
      { path: 'managerIds', select: 'employeeName email' }
    ]
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Remove a department from a project
// ─────────────────────────────────────────────────────────────────────────────
export const removeDepartmentFromProject = async (
  projectId: string,
  departmentId: string
) => {
  const link = await ProjectDepartment.findOne({ projectId, departmentId });
  if (!link) {
    throw Object.assign(
      new Error('Department is not linked to this project.'),
      { statusCode: 404 }
    );
  }
  return ProjectDepartment.findByIdAndDelete(link._id);
};
