import { Router } from 'express';
import { getIssues, createIssue, updateIssue, deleteIssue } from '../controllers/issue.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/', getIssues);
router.post('/', createIssue);
router.put('/:issueId', updateIssue);
router.delete('/:issueId', deleteIssue);

export default router;
