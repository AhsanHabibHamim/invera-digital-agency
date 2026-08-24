import { Router } from 'express';
import { analyticsController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

router.get('/dashboard', authGuard, roleGuard('admin'), analyticsController.getDashboard);
router.get('/team-workload', authGuard, roleGuard('admin'), analyticsController.getTeamWorkload);

export default router;
