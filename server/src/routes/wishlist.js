import { Router } from 'express';
import * as wishlistController from '../controllers/wishlistController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', wishlistController.getWishlist);
router.post('/toggle/:productId', wishlistController.toggleWishlist);

export default router;
