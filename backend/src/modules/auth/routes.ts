import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './controller';
import { validate } from '../../middleware/validate';
import { authGuard } from '../../middleware/authGuard';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, sendVerificationSchema, verifyEmailSchema, changePasswordSchema, updateProfileSchema } from './validation';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Try again later.' },
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification requests. Try again later.' },
});

router.post('/register', rateLimit({ windowMs: 15 * 60 * 1000, max: 8, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many registrations. Try again later.' } }), validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authGuard, authController.logout);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/send-verification', verificationLimiter, validate(sendVerificationSchema), authController.sendVerificationEmail);
router.post('/verify-email', verificationLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.get('/me', authGuard, authController.me);
router.patch('/password', authGuard, validate(changePasswordSchema), authController.changePassword);
router.patch('/profile', authGuard, validate(updateProfileSchema), authController.updateProfile);

export default router;
