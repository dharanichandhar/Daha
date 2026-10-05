import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as customerController from '../controllers/customerController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', requireAdmin, adminController.getDashboard);
router.get('/customers', requireAdmin, customerController.getCustomers);
router.get('/customers/:id', requireAdmin, customerController.getCustomerDetail);
router.get('/inventory', requireAdmin, adminController.getInventory);
router.put('/inventory/adjust', requireAdmin, adminController.adjustInventory);
router.get('/audit-logs', requireAdmin, adminController.getAuditLogs);

export default router;
