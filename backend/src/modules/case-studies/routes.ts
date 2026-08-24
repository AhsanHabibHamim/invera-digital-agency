import { Router } from 'express';
import { caseStudyController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { caseStudySchema, updateCaseStudySchema } from '../blog/validation';

const router = Router();

router.get('/public', caseStudyController.getAllPublic);
router.get('/public/:slug', caseStudyController.getBySlug);
router.get('/', authGuard, roleGuard('admin'), caseStudyController.getAll);
router.post('/', authGuard, roleGuard('admin'), validate(caseStudySchema), caseStudyController.create);
router.patch('/:id', authGuard, roleGuard('admin'), validate(updateCaseStudySchema), caseStudyController.update);
router.delete('/:id', authGuard, roleGuard('admin'), caseStudyController.remove);

export default router;
