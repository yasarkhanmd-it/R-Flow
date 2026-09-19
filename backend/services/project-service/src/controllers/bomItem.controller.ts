import { Request, Response } from 'express';
import { BomItem } from '../models/bomItemModel';
import { BomRevision } from '../models/bomRevisionModel';

// Check if revision is released
const isRevisionEditable = async (revisionId: string) => {
  const revision = await BomRevision.findById(revisionId);
  if (!revision) return false;
  return revision.status === 'Draft';
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const { revisionId } = req.params;
    const items = await BomItem.find({ revisionId }).lean();
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const { revisionId } = req.params;
    
    if (!(await isRevisionEditable(revisionId))) {
      return res.status(403).json({ success: false, message: 'Cannot edit a non-draft revision' });
    }

    const item = new BomItem({
      ...req.body,
      revisionId
    });
    
    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const item = await BomItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (!(await isRevisionEditable(item.revisionId.toString()))) {
       return res.status(403).json({ success: false, message: 'Cannot edit a non-draft revision' });
    }

    Object.assign(item, req.body);
    await item.save();

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const item = await BomItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (!(await isRevisionEditable(item.revisionId.toString()))) {
       return res.status(403).json({ success: false, message: 'Cannot edit a non-draft revision' });
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
