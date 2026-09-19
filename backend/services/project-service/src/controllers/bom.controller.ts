import { Request, Response } from 'express';
import { Bom } from '../models/bomModel';
import { BomRevision } from '../models/bomRevisionModel';
import { BomItem } from '../models/bomItemModel';
import { auditLogger } from '../utils/audit.logger';
import { PurchaseOrder } from '../models/purchaseOrderModel';
import { GoodsReceipt } from '../models/grnModel';

export const getBoms = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const boms = await Bom.find({ projectId })
      .populate('currentRevisionId')
      .populate('ownerId', 'employeeName email')
      .lean();
    res.json({ success: true, data: boms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBom = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;
    
    const { titleAssembly, name, ...restData } = req.body;
    const bomName = name || titleAssembly || 'Untitled Assembly';

    const bom = new Bom({
      ...restData,
      titleAssembly: titleAssembly || bomName,
      name: bomName,
      projectId,
      ownerId: user._id || user.id,
      createdBy: user._id || user.id
    });
    
    await bom.save();

    // Create initial Revision A
    const revNum = req.body.revision || 'A';
    const revision = new BomRevision({
      bomId: bom._id,
      revisionNumber: revNum.startsWith('Rev') ? revNum : `Rev ${revNum}`,
      description: 'Initial Revision',
      status: req.body.status || 'Draft',
      createdBy: user._id || user.id
    });
    await revision.save();

    // Update Bom with currentRevisionId
    bom.currentRevisionId = revision._id;
    await bom.save();

    const populatedBom = await Bom.findById(bom._id)
      .populate('currentRevisionId')
      .populate('ownerId', 'employeeName email')
      .lean();

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'BOM',
      entityId: bom._id,
      entityName: bom.title,
      description: `BOM created: ${bom.title}`
    });

    res.status(201).json({ success: true, data: populatedBom });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBom = async (req: Request, res: Response) => {
  try {
    const { bomId } = req.params;
    const bom = await Bom.findByIdAndUpdate(
      bomId,
      { $set: req.body },
      { new: true }
    )
    .populate('currentRevisionId')
    .populate('ownerId', 'employeeName email');
    
    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'BOM',
      entityId: bom._id,
      entityName: bom.title,
      description: `BOM updated: ${bom.title}`
    });

    res.json({ success: true, data: bom });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBom = async (req: Request, res: Response) => {
  try {
    const { bomId } = req.params;
    const bom = await Bom.findById(bomId);
    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }
    
    // Find all revisions
    const revisions = await BomRevision.find({ bomId });
    const revisionIds = revisions.map(r => r._id);

    // Delete all items in all revisions
    await BomItem.deleteMany({ revisionId: { $in: revisionIds } });

    // Delete all revisions
    await BomRevision.deleteMany({ bomId });

    // Delete BOM
    await Bom.findByIdAndDelete(bomId);

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'BOM',
      entityId: bomId,
      entityName: bom.title,
      description: `BOM and revisions deleted: ${bom.title}`
    });

    res.json({ success: true, message: 'BOM and all its revisions deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaterialStatus = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    // Find all POs for this project
    const pos = await PurchaseOrder.find({ projectId }).lean();
    const poIds = pos.map(po => po._id);
    
    // Find all GRNs for this project
    const grns = await GoodsReceipt.find({ projectId }).lean();

    // Map ordered quantities
    const orderedMap: Record<string, number> = {};
    pos.forEach(po => {
      po.items.forEach((item: any) => {
        if (item.bomItemId) {
          const id = item.bomItemId.toString();
          orderedMap[id] = (orderedMap[id] || 0) + item.quantityOrdered;
        }
      });
    });

    // Map received quantities
    const receivedMap: Record<string, number> = {};
    grns.forEach(grn => {
      grn.items.forEach((item: any) => {
        // Need to find which BOM item this poItem maps to
        // Because GRN item only has poItemId
        let bomItemId = null;
        for (const po of pos) {
          const poItem = po.items.find((i: any) => i._id.toString() === item.poItemId.toString());
          if (poItem && poItem.bomItemId) {
            bomItemId = poItem.bomItemId.toString();
            break;
          }
        }
        if (bomItemId) {
          receivedMap[bomItemId] = (receivedMap[bomItemId] || 0) + item.quantityReceived;
        }
      });
    });

    res.json({
      success: true,
      data: {
        ordered: orderedMap,
        received: receivedMap
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

