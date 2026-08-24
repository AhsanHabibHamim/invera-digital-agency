import { Router } from 'express';
import { messageController } from './controller';
import { authGuard } from '../../middleware/authGuard';

const router = Router();

router.use(authGuard);
router.get('/', messageController.getAll);
router.get('/unread/counts', messageController.getUnreadCounts);
router.get('/:projectId', messageController.getByProject);
router.post('/:projectId', messageController.send);
router.patch('/:projectId/read', messageController.markProjectRead);
router.post('/:id/reply', messageController.reply);

export default router;
