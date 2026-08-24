import { Router } from 'express';
import { taskController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  subtaskSchema,
  updateSubtaskSchema,
  createSprintSchema,
  updateSprintSchema,
  timeEntrySchema,
} from './validation';

const router = Router();

router.use(authGuard);

// NOTE: specific paths MUST be registered before '/:id', otherwise Express
// matches them as an id param (e.g. GET /tasks/time -> getById('time')).
// Sprints (nested under projects in practice, but here as standalone for flexibility)
router.get('/sprints/project/:projectId', taskController.getSprints);
router.post('/sprints', roleGuard('admin', 'team', 'super_admin'), validate(createSprintSchema), taskController.createSprint);
router.patch('/sprints/:id', roleGuard('admin', 'team', 'super_admin'), validate(updateSprintSchema), taskController.updateSprint);
router.delete('/sprints/:id', roleGuard('admin', 'super_admin'), taskController.deleteSprint);

// Time entries
router.get('/time/stats', taskController.getTimeStats);
router.get('/time', taskController.getTimeEntries);
router.post('/time', roleGuard('admin', 'team', 'super_admin'), validate(timeEntrySchema), taskController.createTimeEntry);
router.delete('/time/:id', taskController.deleteTimeEntry);

// Tasks — writes are staff-only; clients/team get read access scoped in the controller.
router.get('/', taskController.getAll);
router.post('/', roleGuard('admin', 'team', 'super_admin'), validate(createTaskSchema), taskController.create);
router.get('/:id', taskController.getById);
router.patch('/:id', roleGuard('admin', 'team', 'super_admin'), validate(updateTaskSchema), taskController.update);
router.delete('/:id', roleGuard('admin', 'super_admin'), taskController.remove);
router.post('/:id/subtasks', roleGuard('admin', 'team', 'super_admin'), validate(subtaskSchema), taskController.addSubtask);
router.patch('/:id/subtasks/:subtaskId', roleGuard('admin', 'team', 'super_admin'), validate(updateSubtaskSchema), taskController.updateSubtask);
router.delete('/:id/subtasks/:subtaskId', roleGuard('admin', 'team', 'super_admin'), taskController.removeSubtask);

export default router;
