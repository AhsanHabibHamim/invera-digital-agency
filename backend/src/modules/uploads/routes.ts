import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadController } from './controller';
import { authGuard } from '../../middleware/authGuard';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../../uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // SVG excluded to prevent stored-XSS via inline-served files.
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|zip|rar|mp4|mov|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) return cb(null, true);
    cb(new Error('File type not allowed'));
  },
});

const router = Router();

router.use(authGuard);
router.post('/', upload.single('file'), uploadController.uploadFile);
router.get('/:projectId', uploadController.getProjectFiles);

export default router;
