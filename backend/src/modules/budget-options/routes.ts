import { Router } from 'express';
import { budgetOptionController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createBudgetOptionSchema, updateBudgetOptionSchema, reorderBudgetOptionsSchema } from './validation';

const router = Router();

// Public
router.get('/', budgetOptionController.getAllPublic);

// Admin (roleGuard('admin') also permits super_admin)
router.get('/admin', authGuard, roleGuard('admin'), budgetOptionController.getAll);
router.get('/:id', authGuard, roleGuard('admin'), budgetOptionController.getById);
router.post('/', authGuard, roleGuard('admin'), validate(createBudgetOptionSchema), budgetOptionController.create);
router.patch('/:id', authGuard, roleGuard('admin'), validate(updateBudgetOptionSchema), budgetOptionController.update);
router.delete('/:id', authGuard, roleGuard('admin'), budgetOptionController.remove);
router.patch('/:id/toggle', authGuard, roleGuard('admin'), budgetOptionController.toggleActive);
router.post('/reorder', authGuard, roleGuard('admin'), validate(reorderBudgetOptionsSchema), budgetOptionController.reorder);

export default router;
