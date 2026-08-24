import { Router } from 'express';
import { hrController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createLeaveSchema, approveLeaveSchema, createApplicationSchema, updateApplicationSchema } from './validation';

const router = Router();

router.use(authGuard);

// Stats
router.get('/stats', roleGuard('admin', 'super_admin'), hrController.getStats);

// Attendance
router.get('/attendance', roleGuard('admin', 'super_admin'), hrController.getAttendance);
router.post('/attendance/check-in', hrController.checkIn);
router.post('/attendance/check-out', hrController.checkOut);

// Leave
router.get('/leaves', hrController.getLeaves);
router.post('/leaves', validate(createLeaveSchema), hrController.createLeave);
router.patch('/leaves/:id/approve', roleGuard('admin', 'super_admin'), validate(approveLeaveSchema), hrController.approveLeave);

// Recruitment
router.get('/recruitment', roleGuard('admin', 'super_admin'), hrController.getApplications);
router.get('/recruitment/public', hrController.getApplications);
router.post('/recruitment', validate(createApplicationSchema), hrController.createApplication);
router.patch('/recruitment/:id', roleGuard('admin', 'super_admin'), validate(updateApplicationSchema), hrController.updateApplication);
router.delete('/recruitment/:id', roleGuard('admin', 'super_admin'), hrController.deleteApplication);

export default router;
