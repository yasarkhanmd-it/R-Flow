import { Request, Response } from 'express';
import { GoodsReceipt } from '../models/grnModel';
import { PurchaseOrder } from '../models/purchaseOrderModel';
import { auditLogger } from '../utils/audit.logger';

export const getProjectGRNs = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const grns = await GoodsReceipt.find({ projectId })
      .populate('poId', 'poNumber supplierId')
      .populate('receivedBy', 'employeeName email')
      .sort({ receiptDate: -1 })
      .lean();
    res.json({ success: true, data: grns });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGRN = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;

    const isAdminLevel = user?.superAdmin === true || user?.role === 'Administrator' || user?.role === 'Unit Head';
    if (user?.role !== 'Manager' && user?.role !== 'Lead' && !isAdminLevel) {
      return res.status(403).json({ success: false, message: 'Only managers, leads, or administrators can create GRNs' });
    }
    
    // verify PO exists and belongs to project
    const po = await PurchaseOrder.findById(req.body.poId);
    if (!po || po.projectId.toString() !== projectId) {
      return res.status(400).json({ success: false, message: 'Invalid PO for this project' });
    }

    // Validate over-receiving
    const existingGrns = await GoodsReceipt.find({ poId: po._id }).lean();
    const receivedMap: Record<string, number> = {};
    existingGrns.forEach(g => {
      g.items.forEach((i: any) => {
        const pId = i.poItemId.toString();
        receivedMap[pId] = (receivedMap[pId] || 0) + i.quantityReceived;
      });
    });

    for (const item of req.body.items) {
      const poItem = po.items.find((i: any) => i._id.toString() === item.poItemId.toString());
      if (!poItem) {
        return res.status(400).json({ success: false, message: `PO Item ${item.poItemId} not found` });
      }
      const alreadyReceived = receivedMap[item.poItemId.toString()] || 0;
      if (alreadyReceived + item.quantityReceived > poItem.quantityOrdered) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot receive more than ordered for item. Ordered: ${poItem.quantityOrdered}, Already Received: ${alreadyReceived}, Attempting to Receive: ${item.quantityReceived}` 
        });
      }
    }

    const grn = new GoodsReceipt({
      ...req.body,
      projectId,
      receivedBy: user._id || user.id
    });
    
    await grn.save();

    // Auto-update PO status based on receipts? For simplicity, we just mark Partially Received
    if (po.status === 'Draft' || po.status === 'Issued') {
      po.status = 'Partially Received';
      await po.save();
    }

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'GOODS_RECEIPT',
      entityId: grn._id.toString(),
      entityName: grn.receiptNumber,
      description: `Goods Receipt created: ${grn.receiptNumber} for PO ${po.poNumber}`
    });

    res.status(201).json({ success: true, data: grn });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
