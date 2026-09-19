import { Router } from 'express';
import { getItems, createItem, updateItem, deleteItem } from '../controllers/bomItem.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/:revisionId', getItems);
router.post('/:revisionId', createItem);
router.put('/:itemId', updateItem);
router.delete('/:itemId', deleteItem);

export default router;
