import { Router } from 'express';
import { activityLogController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

router.get('/', authGuard, roleGuard('admin'), activityLogController.getAll);

export default router;
