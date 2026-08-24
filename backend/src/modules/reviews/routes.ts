import { Router } from 'express';
import { reviewController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

router.get('/public', reviewController.getAllPublic);
router.get('/', authGuard, roleGuard('admin'), reviewController.getAll);
router.post('/', authGuard, roleGuard('client'), reviewController.create);
router.patch('/:id/approve', authGuard, roleGuard('admin'), reviewController.approve);

export default router;
