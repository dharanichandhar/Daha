import { Router } from 'express';
import * as cartController from '../controllers/cartController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/item/:itemId', cartController.updateCartItem);
router.delete('/item/:itemId', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);

export default router;
