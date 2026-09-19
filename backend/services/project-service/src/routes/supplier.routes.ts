import express from 'express';
import { getSuppliers, createSupplier, updateSupplier } from '../controllers/supplier.controller';
import { protect } from '../../../../common/middleware/auth.middleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, createSupplier);
router.route('/:id')
  .put(protect, updateSupplier);

export default router;
