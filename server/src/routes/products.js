import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', productController.getProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/featured', productController.getFeatured);
router.get('/related/:slug', productController.getRelatedProducts);
router.get('/:slug', productController.getProductBySlug);

router.post('/', requireAdmin, productController.createProduct);
router.put('/:id', requireAdmin, productController.updateProduct);
router.put('/:id/archive', requireAdmin, productController.archiveProduct);
router.delete('/:id', requireAdmin, productController.deleteProduct);
router.get('/admin/all', requireAdmin, productController.getAllProductsAdmin);

export default router;
