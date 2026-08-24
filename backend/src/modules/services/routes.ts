import { Router } from 'express';
import { serviceController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createServiceSchema, updateServiceSchema } from './validation';

const router = Router();

router.get('/', serviceController.getAll);
router.get('/slug/:slug', serviceController.getBySlug);
router.get('/:id', serviceController.getById);
router.post('/', authGuard, roleGuard('admin'), validate(createServiceSchema), serviceController.create);
router.patch('/:id', authGuard, roleGuard('admin'), validate(updateServiceSchema), serviceController.update);
router.delete('/:id', authGuard, roleGuard('admin'), serviceController.remove);

export default router;
