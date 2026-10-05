import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, orderController.createOrder);
router.get('/my-orders', requireAuth, orderController.getMyOrders);
router.get('/success/:orderId', requireAuth, orderController.getOrderSuccess);
router.get('/:orderId', requireAuth, orderController.getOrderDetail);
router.get('/track/:orderNumber', orderController.trackOrder);

router.get('/admin/all', requireAdmin, orderController.getAllOrdersAdmin);
router.get('/admin/:orderId', requireAdmin, orderController.getOrderDetailAdmin);
router.put('/admin/:orderId/status', requireAdmin, orderController.updateOrderStatus);
router.put('/admin/:orderId/tracking', requireAdmin, orderController.updateTracking);
router.get('/admin/stats/dashboard', requireAdmin, orderController.getDashboardStats);

export default router;
