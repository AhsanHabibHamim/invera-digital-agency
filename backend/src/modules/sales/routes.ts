import { Router } from 'express';
import { salesController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import {
  createPipelineSchema,
  updatePipelineSchema,
  createTargetSchema,
  updateTargetSchema,
  createCommissionSchema,
} from './validation';

const router = Router();

router.use(authGuard);

// Stats
router.get('/stats', roleGuard('admin', 'super_admin'), salesController.getStats);

// Pipeline
router.get('/pipelines', roleGuard('admin', 'super_admin', 'team'), salesController.getPipelines);
router.post('/pipelines', roleGuard('admin', 'super_admin'), validate(createPipelineSchema), salesController.createPipeline);
router.patch('/pipelines/:id', roleGuard('admin', 'super_admin'), validate(updatePipelineSchema), salesController.updatePipeline);
router.delete('/pipelines/:id', roleGuard('admin', 'super_admin'), salesController.deletePipeline);

// Targets
router.get('/targets', roleGuard('admin', 'super_admin'), salesController.getTargets);
router.post('/targets', roleGuard('admin', 'super_admin'), validate(createTargetSchema), salesController.createTarget);
router.patch('/targets/:id', roleGuard('admin', 'super_admin'), validate(updateTargetSchema), salesController.updateTarget);
router.delete('/targets/:id', roleGuard('admin', 'super_admin'), salesController.deleteTarget);

// Commissions
router.get('/commissions', roleGuard('admin', 'super_admin'), salesController.getCommissions);
router.post('/commissions', roleGuard('admin', 'super_admin'), validate(createCommissionSchema), salesController.createCommission);
router.patch('/commissions/:id/approve', roleGuard('admin', 'super_admin'), salesController.approveCommission);
router.patch('/commissions/:id/paid', roleGuard('admin', 'super_admin'), salesController.markPaid);

export default router;
