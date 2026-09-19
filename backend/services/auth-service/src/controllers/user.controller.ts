import { Request, Response } from 'express';
import { userRepo } from '../repo/userrepo';
import { buildUserResponse } from '../services/auth.service';
import { User } from '../models/userModel';
import mongoose from 'mongoose';

// ── Helper ────────────────────────────────────────────────────────────────────
const isAdminOrSuperAdmin = (user: any) =>
  user?.superAdmin === true || user?.role === 'Administrator';

// ── GET /api/users ────────────────────────────────────────────────────────────
// Used by dropdowns (managers/leads) — returns Approved users filtered by role.
// Also used by Administrator for full user list (all statuses).
export const getUsers = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    const filterQuery: any = {};

    if (req.query.role) {
      filterQuery.role = req.query.role;
    }
    if (req.query.department) {
      filterQuery.department = req.query.department;
    }

    // Only return Approved users for dropdown use; admin gets all
    if (!isAdminOrSuperAdmin(requestingUser)) {
      filterQuery.status = 'Approved';
    }

    const users = await userRepo.find(filterQuery);
    const mappedUsers = users.map(user => buildUserResponse(user));

    res.json({ success: true, data: mappedUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching users' });
  }
};

// ── GET /api/users/all ────────────────────────────────────────────────────────
// Administrator / SuperAdmin only — returns ALL users regardless of status.
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;

    if (!isAdminOrSuperAdmin(requestingUser)) {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator authorization required.' });
    }

    const users = await userRepo.find({});
    const mappedUsers = users.map(user => buildUserResponse(user));

    res.json({ success: true, data: mappedUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching users' });
  }
};

// ── PUT /api/users/:id/department ─────────────────────────────────────────────
// Administrator / SuperAdmin only — assigns or removes a user's departmentId.
export const assignUserDepartment = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;

    if (!isAdminOrSuperAdmin(requestingUser)) {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator authorization required.' });
    }

    const { id } = req.params;
    const { departmentId, departmentName, verticalId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const updateData: any = {};

    if (departmentId === null || departmentId === '') {
      // Remove department assignment
      updateData.departmentId = null;
      updateData.department = 'Unassigned';
      updateData.verticalId = null;
    } else {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ success: false, message: 'Invalid department ID.' });
      }
      
      if (verticalId) {
        if (!mongoose.Types.ObjectId.isValid(verticalId)) {
          return res.status(400).json({ success: false, message: 'Invalid vertical ID.' });
        }
        
        // Validate that the department belongs to the vertical
        if (!mongoose.connection.db) {
           return res.status(500).json({ success: false, message: 'Database connection not ready.' });
        }
        
        const dept = await mongoose.connection.db.collection('departments').findOne({
          _id: new mongoose.Types.ObjectId(departmentId),
          verticalId: new mongoose.Types.ObjectId(verticalId)
        });
        
        if (!dept) {
          return res.status(400).json({ success: false, message: 'Selected Department does not belong to the selected Vertical.' });
        }
        
        updateData.verticalId = verticalId;
      }
      
      updateData.departmentId = departmentId;
      if (departmentName) {
        updateData.department = departmentName;
      }
    }

    const updated = await userRepo.updateUser(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'Department assigned successfully.', data: buildUserResponse(updated) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error assigning department' });
  }
};

// ── PUT /api/users/:id/role ───────────────────────────────────────────────────
// Administrator / SuperAdmin only — update a user's role.
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;

    if (!isAdminOrSuperAdmin(requestingUser)) {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator authorization required.' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['User', 'Lead', 'Manager'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Allowed: User, Lead, Manager.' });
    }

    const targetUser = await userRepo.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent modifying SuperAdmin accounts
    if (targetUser.superAdmin) {
      return res.status(403).json({ success: false, message: 'Cannot modify Super Admin account.' });
    }

    // Prevent modifying another Administrator account
    if (targetUser.role === 'Administrator' && !requestingUser.superAdmin) {
      return res.status(403).json({ success: false, message: 'Cannot modify Administrator accounts.' });
    }

    const updated = await userRepo.updateUser(id, { role });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: 'Role updated successfully.', data: buildUserResponse(updated) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating role' });
  }
};
