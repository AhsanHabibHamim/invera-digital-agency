import { Router } from 'express';
import { cmsController } from './controller';
import { authGuard } from '../../middleware/authGuard';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

router.get('/:pageKey', cmsController.getPageContent);
router.get('/:pageKey/:sectionKey', cmsController.getSectionContent);
router.put('/:pageKey', authGuard, roleGuard('admin'), cmsController.upsertContent);
router.patch('/:pageKey/seo', authGuard, roleGuard('admin'), cmsController.updateSeo);
router.delete('/:pageKey/:sectionKey', authGuard, roleGuard('admin'), cmsController.remove);

export default router;
