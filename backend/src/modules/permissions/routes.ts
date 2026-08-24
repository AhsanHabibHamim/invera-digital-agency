import { Router } from 'express';
import { permissionController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createPermissionSchema, updatePermissionSchema } from './validation';

const router = Router();

router.use(authGuard);
router.use(roleGuard('super_admin', 'admin'));

router.get('/groups', permissionController.getGroups);
router.get('/modules', permissionController.getModules);
router.get('/', permissionController.getAll);
router.get('/:id', permissionController.getById);
router.post('/', validate(createPermissionSchema), permissionController.create);
router.patch('/:id', validate(updatePermissionSchema), permissionController.update);
router.delete('/:id', permissionController.remove);

export default router;
