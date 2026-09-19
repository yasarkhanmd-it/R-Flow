import express from 'express';
import { getProjectGRNs, createGRN } from '../controllers/grn.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/', getProjectGRNs);
router.post('/', createGRN);

export default router;
