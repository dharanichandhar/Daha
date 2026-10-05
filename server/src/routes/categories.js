import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/admin/all', requireAdmin, categoryController.getAllCategoriesAdmin);
router.get('/:slug', categoryController.getCategoryBySlug);

router.post('/', requireAdmin, categoryController.createCategory);
router.put('/:id', requireAdmin, categoryController.updateCategory);
router.delete('/:id', requireAdmin, categoryController.deleteCategory);
router.put('/:id/reorder', requireAdmin, categoryController.reorderCategory);

export default router;
