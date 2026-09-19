import { Router } from 'express';
import { getBoms, createBom, updateBom, deleteBom, getMaterialStatus } from '../controllers/bom.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/', getBoms);
router.get('/material-status', getMaterialStatus);
router.post('/', createBom);
router.put('/:bomId', updateBom);
router.delete('/:bomId', deleteBom);

export default router;
