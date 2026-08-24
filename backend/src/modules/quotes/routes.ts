import { Router } from 'express';
import { quoteController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createQuoteSchema, updateQuoteSchema, sendQuoteSchema } from './validation';

const router = Router();

router.use(authGuard);
router.get('/', quoteController.getAll);
router.get('/:id', quoteController.getById);
router.post('/', roleGuard('admin', 'super_admin'), validate(createQuoteSchema), quoteController.create);
router.patch('/:id', roleGuard('admin', 'super_admin'), validate(updateQuoteSchema), quoteController.update);
router.patch('/:id/send', roleGuard('admin', 'super_admin'), validate(sendQuoteSchema), quoteController.sendQuote);
router.delete('/:id', roleGuard('admin', 'super_admin'), quoteController.remove);
router.post('/:id/convert-to-invoice', roleGuard('admin', 'super_admin'), quoteController.convertToInvoice);

export default router;
