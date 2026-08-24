import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { chatbotController } from './controller';

const router = Router();

// Public endpoint — strict rate limit to prevent API-key abuse.
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please slow down.' },
});

router.post('/message', chatbotLimiter, chatbotController.message);

export default router;
