import { Router } from 'express';
import { supportController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import {
  createTicketSchema,
  updateTicketSchema,
  replySchema,
  assignTicketSchema,
  createCategorySchema,
  updateCategorySchema,
} from './validation';

const router = Router();

router.use(authGuard);

// Ticket routes
router.get('/stats', roleGuard('admin', 'super_admin'), supportController.getStats);
router.get('/', supportController.getAllTickets);
router.get('/:id', supportController.getTicketById);
router.post('/', validate(createTicketSchema), supportController.createTicket);
router.patch('/:id', roleGuard('admin', 'super_admin'), validate(updateTicketSchema), supportController.updateTicket);
router.patch('/:id/assign', roleGuard('admin', 'super_admin'), validate(assignTicketSchema), supportController.assignTicket);
router.post('/:id/reply', validate(replySchema), supportController.reply);
router.patch('/:id/close', supportController.closeTicket);

// Category routes
router.get('/categories/all', roleGuard('admin', 'super_admin'), supportController.getCategories);
router.get('/categories', supportController.getCategories);
router.post('/categories', roleGuard('admin', 'super_admin'), validate(createCategorySchema), supportController.createCategory);
router.patch('/categories/:id', roleGuard('admin', 'super_admin'), validate(updateCategorySchema), supportController.updateCategory);
router.delete('/categories/:id', roleGuard('admin', 'super_admin'), supportController.deleteCategory);

export default router;
