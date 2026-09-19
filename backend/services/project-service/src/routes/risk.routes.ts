import { Router } from 'express';
import { getRisks, createRisk, updateRisk, deleteRisk } from '../controllers/risk.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getRisks)
  .post(createRisk);

router.route('/:riskId')
  .put(updateRisk)
  .delete(deleteRisk);

export default router;
