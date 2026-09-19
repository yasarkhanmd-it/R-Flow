import { Request, Response } from 'express';
import { PurchaseOrder } from '../models/purchaseOrderModel';
import { auditLogger } from '../utils/audit.logger';

export const getProjectPOs = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const pos = await PurchaseOrder.find({ projectId })
      .populate('supplierId', 'name contactEmail')
      .populate('createdBy', 'employeeName email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: pos });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPO = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;
    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator' || user?.role === 'Unit Head';
    if (user?.role !== 'Manager' && user?.role !== 'Lead' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'Only managers, leads, or administrators can create POs' });
    }
    
    const po = new PurchaseOrder({
      ...req.body,
      projectId,
      createdBy: user._id || user.id
    });
    
    await po.save();

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'PURCHASE_ORDER',
      entityId: po._id.toString(),
      entityName: po.poNumber,
      description: `Purchase Order created: ${po.poNumber}`
    });

    res.status(201).json({ success: true, data: po });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator' || user?.role === 'Unit Head';
    if (user?.role !== 'Manager' && user?.role !== 'Lead' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'Only managers, leads, or administrators can update POs' });
    }

    const po = await PurchaseOrder.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    if (!po) {
      return res.status(404).json({ success: false, message: 'PO not found' });
    }

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'PURCHASE_ORDER',
      entityId: po._id.toString(),
      entityName: po.poNumber,
      description: `Purchase Order updated: ${po.poNumber}`
    });

    res.json({ success: true, data: po });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
