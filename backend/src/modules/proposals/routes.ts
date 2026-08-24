import { Router } from 'express';
import { proposalController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createProposalSchema, updateProposalSchema, adminReviewSchema } from './validation';

const router = Router();

router.use(authGuard);

// Client routes
router.post('/', roleGuard('client'), validate(createProposalSchema), proposalController.create);
router.patch('/:id', roleGuard('client', 'admin'), validate(updateProposalSchema), proposalController.update);
router.delete('/:id', roleGuard('client', 'admin'), proposalController.remove);
router.post('/:id/accept-quote', roleGuard('client'), proposalController.acceptQuote);
router.post('/:id/request-changes', roleGuard('client'), proposalController.requestChanges);

// Admin routes
router.get('/', proposalController.getAll);
router.get('/:id', proposalController.getById);
router.patch('/:id/review', roleGuard('admin'), validate(adminReviewSchema), proposalController.review);
router.post('/:id/approve', roleGuard('admin'), proposalController.approveAndCreateProject);

export default router;
