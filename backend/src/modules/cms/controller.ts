import { Request, Response, NextFunction } from 'express';
import CmsContent from './model';
import BlogPost from '../blog/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { normalizeCmsContent } from './schemas';

export class CmsController {
  async getPageContent(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await CmsContent.find({ pageKey: req.params.pageKey });
      sendSuccess(res, content);
    } catch (error) {
      next(error);
    }
  }

  async getSectionContent(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await CmsContent.findOne({
        pageKey: req.params.pageKey,
        sectionKey: req.params.sectionKey,
      });
      if (!content) throw new AppError('Content not found', 404);
      sendSuccess(res, content);
    } catch (error) {
      next(error);
    }
  }

  async upsertContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sectionKey, content } = req.body;
      if (!sectionKey) throw new AppError('sectionKey is required', 400);

      const normalized = normalizeCmsContent(req.params.pageKey, sectionKey, content);
      const payload: Record<string, unknown> = {
        ...req.body,
        pageKey: req.params.pageKey,
      };
      if (content !== undefined) payload.content = normalized.content;

      const saved = await CmsContent.findOneAndUpdate(
        { pageKey: req.params.pageKey, sectionKey },
        payload,
        { upsert: true, new: true }
      );
      sendSuccess(res, saved, normalized.changed ? 'Content saved (shape normalized)' : 'Content saved');
    } catch (error) {
      next(error);
    }
  }

  async updateSeo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const seo = {
        metaTitle: req.body.metaTitle,
        metaDescription: req.body.metaDescription,
        ogImage: req.body.ogImage,
      };
      const content = await CmsContent.findOneAndUpdate(
        { pageKey: req.params.pageKey, sectionKey: 'seo' },
        { contentType: 'json', content: seo, seoMeta: seo },
        { upsert: true, new: true }
      );
      sendSuccess(res, content, 'SEO updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const content = await CmsContent.findOneAndDelete({
        pageKey: req.params.pageKey,
        sectionKey: req.params.sectionKey,
      });
      if (!content) throw new AppError('Content not found', 404);
      sendSuccess(res, null, 'Content deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const cmsController = new CmsController();
