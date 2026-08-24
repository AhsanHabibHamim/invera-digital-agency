import { Router } from 'express';
import { userController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema } from './validation';

const router = Router();

router.use(authGuard);
router.get('/', roleGuard('admin'), userController.getAll);
router.get('/:id', roleGuard('admin'), userController.getById);
router.post('/', roleGuard('admin'), validate(createUserSchema), userController.create);
router.patch('/:id', roleGuard('admin'), validate(updateUserSchema), userController.update);
router.patch('/:id/deactivate', roleGuard('admin'), userController.deactivate);
router.get('/:id/roles', roleGuard('admin'), userController.getRoles);
router.post('/:id/roles', roleGuard('admin'), userController.assignRole);
router.delete('/:id/roles/:roleId', roleGuard('admin'), userController.removeRole);

export default router;
