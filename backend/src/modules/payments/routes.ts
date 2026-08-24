import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { paymentController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';

const screenshotStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../../../uploads'),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const screenshotUpload = multer({
  storage: screenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  },
});

const router = Router();

router.use(authGuard);

// Client submits a manual payment against an invoice (optional screenshot).
router.post(
  '/invoice/:invoiceId',
  roleGuard('client', 'admin', 'super_admin'),
  screenshotUpload.single('screenshot'),
  paymentController.createSubmission,
);
router.get('/mine', roleGuard('client'), paymentController.listMine);
router.get('/invoice/:invoiceId', paymentController.listByInvoice);

// Admin review queue.
router.get('/', roleGuard('admin', 'super_admin'), paymentController.listAll);
router.patch('/:id/confirm', roleGuard('admin', 'super_admin'), paymentController.confirm);
router.patch('/:id/reject', roleGuard('admin', 'super_admin'), paymentController.reject);

export default router;
