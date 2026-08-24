import { Router } from 'express';
import { settingsController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

// Public: clients need payment instructions to pay manually.
router.get('/payments/public', settingsController.getPublicPayments);

router.use(authGuard);
router.get('/payments', roleGuard('admin', 'super_admin'), settingsController.getPayments);
router.patch('/payments', roleGuard('admin', 'super_admin'), settingsController.updatePayments);
router.get('/automation', roleGuard('admin', 'super_admin'), settingsController.getAutomation);
router.patch('/automation', roleGuard('admin', 'super_admin'), settingsController.updateAutomation);

export default router;
