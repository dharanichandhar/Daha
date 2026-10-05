import { Router } from 'express';
import * as bannerController from '../controllers/bannerController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', bannerController.getBanners);

router.get('/admin/all', requireAdmin, bannerController.getAllBannersAdmin);
router.post('/', requireAdmin, bannerController.createBanner);
router.put('/:id', requireAdmin, bannerController.updateBanner);
router.delete('/:id', requireAdmin, bannerController.deleteBanner);

export default router;
