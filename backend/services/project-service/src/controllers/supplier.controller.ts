import { Request, Response } from 'express';
import { Supplier } from '../models/supplierModel';
import { auditLogger } from '../utils/audit.logger';

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator' || user?.role === 'Unit Head';
    if (user?.role !== 'Manager' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'Only managers or administrators can create suppliers' });
    }

    const supplier = new Supplier({
      ...req.body,
      createdBy: user._id || user.id
    });
    
    await supplier.save();

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'SUPPLIER',
      entityId: supplier._id.toString(),
      entityName: supplier.name,
      description: `Supplier created: ${supplier.name}`
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator' || user?.role === 'Unit Head';
    if (user?.role !== 'Manager' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'Only managers or administrators can update suppliers' });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'SUPPLIER',
      entityId: supplier._id.toString(),
      entityName: supplier.name,
      description: `Supplier updated: ${supplier.name}`
    });

    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
