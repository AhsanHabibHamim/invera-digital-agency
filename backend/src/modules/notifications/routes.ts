import { Router } from 'express';
import { notificationController } from './controller';
import { authGuard } from '../../middleware/authGuard';

const router = Router();

router.use(authGuard);
router.get('/', notificationController.getAll);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

export default router;
