import { Router } from 'express';
import { getRevisions, createRevision, updateRevision } from '../controllers/bomRevision.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/', getRevisions);
router.post('/', createRevision);
router.put('/:revisionId', updateRevision);

export default router;
