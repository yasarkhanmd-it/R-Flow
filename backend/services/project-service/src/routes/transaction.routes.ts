import { Router } from 'express';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getFinancialSummary } from '../controllers/transaction.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/summary', getFinancialSummary);
router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:transactionId', updateTransaction);
router.delete('/:transactionId', deleteTransaction);

export default router;
