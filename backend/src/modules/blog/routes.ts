import { Router } from 'express';
import { blogController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createPostSchema, updatePostSchema } from './validation';

const router = Router();

router.get('/public', blogController.getAllPublic);
router.get('/public/:slug', blogController.getBySlug);
router.get('/', authGuard, roleGuard('admin'), blogController.getAll);
router.post('/', authGuard, roleGuard('admin'), validate(createPostSchema), blogController.create);
router.patch('/:id', authGuard, roleGuard('admin'), validate(updatePostSchema), blogController.update);
router.delete('/:id', authGuard, roleGuard('admin'), blogController.remove);

export default router;
