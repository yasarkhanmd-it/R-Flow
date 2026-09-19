import { Request, Response } from 'express';
import { BomRevision } from '../models/bomRevisionModel';
import { BomItem } from '../models/bomItemModel';
import { Bom } from '../models/bomModel';
import { auditLogger } from '../utils/audit.logger';

export const getRevisions = async (req: Request, res: Response) => {
  try {
    const { bomId } = req.params;
    const revisions = await BomRevision.find({ bomId })
      .populate('createdBy', 'employeeName email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: revisions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRevision = async (req: Request, res: Response) => {
  try {
    const { bomId } = req.params;
    const user = (req as any).user;

    const bom = await Bom.findById(bomId).populate('currentRevisionId');
    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const currentRevision = await BomRevision.findById(bom.currentRevisionId);
    if (!currentRevision) {
       return res.status(400).json({ success: false, message: 'Current revision not found' });
    }

    // Generate new revision number (e.g. Rev A -> Rev B)
    const currentRevLetter = currentRevision.revisionNumber.replace('Rev ', '');
    const nextRevLetter = String.fromCharCode(currentRevLetter.charCodeAt(0) + 1);
    const newRevisionNumber = `Rev ${nextRevLetter}`;

    const newRevision = new BomRevision({
      bomId,
      revisionNumber: newRevisionNumber,
      description: req.body.description || `Cloned from ${currentRevision.revisionNumber}`,
      changeReason: req.body.changeReason || '',
      status: 'Draft',
      createdBy: user.id
    });
    await newRevision.save();

    // Clone items from current revision
    const items = await BomItem.find({ revisionId: currentRevision._id }).lean();
    if (items.length > 0) {
      const clonedItems = items.map(item => {
        const { _id, createdAt, updatedAt, ...rest } = item as any;
        return {
          ...rest,
          revisionId: newRevision._id
        };
      });
      await BomItem.insertMany(clonedItems);
    }

    // Update BOM current revision
    bom.currentRevisionId = newRevision._id;
    await bom.save();

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'BOM_REVISION',
      entityId: newRevision._id,
      entityName: newRevision.revisionNumber,
      description: `BOM Revision ${newRevision.revisionNumber} created for BOM ${bom.title}`
    });

    res.status(201).json({ success: true, data: newRevision });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRevision = async (req: Request, res: Response) => {
  try {
    const { revisionId } = req.params;
    const revision = await BomRevision.findByIdAndUpdate(
      revisionId,
      { $set: req.body },
      { new: true }
    ).populate('createdBy', 'employeeName email');
    
    if (!revision) {
      return res.status(404).json({ success: false, message: 'Revision not found' });
    }

    // If released, update BOM status to Released
    if (revision.status === 'Released') {
      await Bom.findByIdAndUpdate(revision.bomId, { status: 'Released' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: revision.status === 'Released' ? 'RELEASED' : 'UPDATED',
      entityType: 'BOM_REVISION',
      entityId: revision._id,
      entityName: revision.revisionNumber,
      description: `BOM Revision ${revision.revisionNumber} updated`
    });

    res.json({ success: true, data: revision });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
