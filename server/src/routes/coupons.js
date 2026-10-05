import { Router } from 'express';
import * as couponController from '../controllers/couponController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/validate', requireAuth, couponController.validateCoupon);

router.get('/', requireAdmin, couponController.getCoupons);
router.post('/', requireAdmin, couponController.createCoupon);
router.put('/:id', requireAdmin, couponController.updateCoupon);
router.delete('/:id', requireAdmin, couponController.deleteCoupon);

export default router;
