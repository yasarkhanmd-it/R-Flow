import { Request, Response } from 'express';
import { Transaction } from '../models/transactionModel';
import { Project } from '../models/projectModel';
import { auditLogger } from '../utils/audit.logger';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const transactions = await Transaction.find({ projectId })
      .populate('createdBy', 'employeeName email')
      .sort({ date: -1 })
      .lean();
    res.json({ success: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const user = (req as any).user;

    const transaction = new Transaction({
      ...req.body,
      projectId,
      createdBy: user.id
    });
    
    await transaction.save();

    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'CREATED',
      entityType: 'TRANSACTION',
      entityId: transaction._id,
      entityName: transaction.title,
      description: `Transaction created: ${transaction.title} for ${transaction.amount}`
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      { $set: req.body },
      { new: true }
    ).populate('createdBy', 'employeeName email');
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'UPDATED',
      entityType: 'TRANSACTION',
      entityId: transaction._id,
      entityName: transaction.title,
      description: `Transaction updated: ${transaction.title}`
    });

    res.json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findByIdAndDelete(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const user = (req as any).user;
    auditLogger.log(req.headers.authorization || '', {
      actorUserId: user._id || user.id,
      actorName: user.employeeName || 'Unknown',
      actorRole: user.role,
      action: 'DELETED',
      entityType: 'TRANSACTION',
      entityId: transactionId,
      entityName: transaction.title,
      description: `Transaction deleted: ${transaction.title}`
    });

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFinancialSummary = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId).select('budget');
    if (!project) {
       return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const transactions = await Transaction.find({ projectId }).lean();
    
    let actualCost = 0;
    let committedCost = 0;
    let realizedRevenue = 0;
    let expectedRevenue = 0;

    transactions.forEach(t => {
      if (t.type === 'Outflow') {
        if (t.status === 'Completed') {
          actualCost += t.amount;
        } else {
          committedCost += t.amount;
        }
      } else if (t.type === 'Inflow') {
        if (t.status === 'Completed') {
          realizedRevenue += t.amount;
        } else {
          expectedRevenue += t.amount;
        }
      }
    });

    res.json({ 
      success: true, 
      data: {
        budget: project.budget || 0,
        actualCost,
        committedCost,
        realizedRevenue,
        expectedRevenue,
        variance: (project.budget || 0) - actualCost
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
