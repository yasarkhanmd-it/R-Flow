import express from 'express';
import { getProjectPOs, createPO, updatePO } from '../controllers/po.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(protect, getProjectPOs)
  .post(protect, createPO);
router.route('/:poId')
  .put(protect, updatePO);

export default router;
