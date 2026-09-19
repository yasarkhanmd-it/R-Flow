import { Router } from 'express';
import { getChangeRequests, createChangeRequest, updateChangeRequest, deleteChangeRequest } from '../controllers/changeRequest.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/', getChangeRequests);
router.post('/', createChangeRequest);
router.put('/:crId', updateChangeRequest);
router.delete('/:crId', deleteChangeRequest);

export default router;
