import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { leadController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

// Public contact form — throttle spam
const publicCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions. Please try again later.' },
});

router.post('/', publicCreateLimiter, leadController.create);
router.get('/my', authGuard, leadController.getMyLeads);
router.get('/status/:status', authGuard, roleGuard('admin', 'team', 'super_admin'), leadController.getByStatus);
router.get('/', authGuard, roleGuard('admin', 'team', 'super_admin'), leadController.getAll);
router.get('/:id', authGuard, roleGuard('admin', 'team', 'super_admin'), leadController.getById);
router.patch('/:id', authGuard, roleGuard('admin', 'super_admin'), leadController.update);
router.patch('/:id/status', authGuard, roleGuard('admin', 'team', 'super_admin'), leadController.updateStatus);
router.patch('/:id/assign', authGuard, roleGuard('admin', 'super_admin'), leadController.assignLead);
router.delete('/:id', authGuard, roleGuard('admin', 'super_admin'), leadController.remove);
router.post('/bulk', authGuard, roleGuard('admin', 'super_admin'), leadController.bulkAction);
router.post('/:id/convert', authGuard, roleGuard('admin', 'super_admin'), leadController.convertToClient);
router.post('/:id/reply', authGuard, roleGuard('admin', 'team', 'super_admin'), leadController.reply);
router.post('/:id/communication', authGuard, roleGuard('admin', 'team', 'super_admin'), leadController.addCommunication);
router.post('/:id/files', authGuard, roleGuard('admin', 'team', 'super_admin'), leadController.addFile);

export default router;
