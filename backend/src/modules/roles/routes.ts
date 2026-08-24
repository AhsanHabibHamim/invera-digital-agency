import { Router } from 'express';
import { roleController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createRoleSchema, updateRoleSchema, cloneRoleSchema, assignPermissionSchema } from './validation';

const router = Router();

router.use(authGuard);
router.use(roleGuard('super_admin', 'admin'));

router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.post('/', validate(createRoleSchema), roleController.create);
router.patch('/:id', validate(updateRoleSchema), roleController.update);
router.delete('/:id', roleController.remove);
router.post('/:id/clone', validate(cloneRoleSchema), roleController.clone);
router.get('/:id/permissions', roleController.getPermissions);
router.post('/:id/permissions', validate(assignPermissionSchema), roleController.assignPermission);
router.delete('/:id/permissions/:permissionId', roleController.removePermission);

export default router;
