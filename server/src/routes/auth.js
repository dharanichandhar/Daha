import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/logout', authController.logout);
router.get('/me', optionalAuth, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/change-password', requireAuth, authController.changePassword);

export default router;
