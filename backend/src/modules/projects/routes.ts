import { Router } from 'express';
import { projectController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createProjectSchema, updateProjectSchema, milestoneSchema } from './validation';

const router = Router();

router.use(authGuard);
router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', roleGuard('admin', 'client'), validate(createProjectSchema), projectController.create);
router.patch('/:id', roleGuard('admin', 'team'), validate(updateProjectSchema), projectController.update);
router.post('/:id/milestones', roleGuard('admin', 'team'), validate(milestoneSchema), projectController.addMilestone);
router.patch('/:id/milestones/:milestoneId', roleGuard('admin', 'team'), projectController.updateMilestone);
router.post('/:id/accept-contract', roleGuard('client'), projectController.acceptContract);
router.post('/:id/request-revision', roleGuard('client'), projectController.requestRevision);
router.patch('/:id/assign-team', roleGuard('admin'), projectController.assignTeam);
router.patch('/:id/archive', roleGuard('admin'), projectController.archive);

export default router;
