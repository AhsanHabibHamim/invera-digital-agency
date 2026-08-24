import { Router } from 'express';
import { pricingController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createPricingPlanSchema, updatePricingPlanSchema, reorderPricingPlansSchema } from './validation';

const router = Router();

// Public
router.get('/', pricingController.getAllPublic);

// Admin (roleGuard('admin') also permits super_admin)
router.get('/admin', authGuard, roleGuard('admin'), pricingController.getAll);
router.get('/:id', authGuard, roleGuard('admin'), pricingController.getById);
router.post('/', authGuard, roleGuard('admin'), validate(createPricingPlanSchema), pricingController.create);
router.patch('/:id', authGuard, roleGuard('admin'), validate(updatePricingPlanSchema), pricingController.update);
router.delete('/:id', authGuard, roleGuard('admin'), pricingController.remove);
router.patch('/:id/toggle', authGuard, roleGuard('admin'), pricingController.toggleActive);
router.post('/reorder', authGuard, roleGuard('admin'), validate(reorderPricingPlansSchema), pricingController.reorder);

export default router;
