import { Router } from 'express';
import { invoiceController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { createInvoiceSchema, updateInvoiceSchema, sendInvoiceSchema } from './validation';

const router = Router();

router.use(authGuard);
router.get('/', invoiceController.getAll);
router.get('/:id', invoiceController.getById);
router.get('/:id/pdf', invoiceController.generatePDF);
router.post('/', roleGuard('admin', 'super_admin'), validate(createInvoiceSchema), invoiceController.create);
router.patch('/:id', roleGuard('admin', 'super_admin'), validate(updateInvoiceSchema), invoiceController.update);
router.patch('/:id/send', roleGuard('admin', 'super_admin'), validate(sendInvoiceSchema), invoiceController.sendInvoice);
router.patch('/:id/void', roleGuard('admin', 'super_admin'), invoiceController.voidInvoice);

export default router;
