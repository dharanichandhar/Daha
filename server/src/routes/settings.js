import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', settingsController.getSettings);
router.put('/', requireAdmin, settingsController.updateSettings);

export default router;
