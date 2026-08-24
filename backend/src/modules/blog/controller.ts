import { Request, Response, NextFunction } from 'express';
import BlogPost from './model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class BlogController {
  async getAllPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '10', tag } = req.query;
      const filter: any = { published: true };
      if (tag) filter.tags = tag;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [posts, total] = await Promise.all([
        BlogPost.find(filter).skip(skip).limit(limitNum).sort({ publishedAt: -1 }),
        BlogPost.countDocuments(filter),
      ]);

      sendSuccess(res, { posts, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await BlogPost.findOne({ slug: req.params.slug, published: true });
      if (!post) throw new AppError('Post not found', 404);
      sendSuccess(res, post);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const posts = await BlogPost.find().sort({ createdAt: -1 });
      sendSuccess(res, posts);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const post = await BlogPost.create({
        ...req.body,
        publishedAt: req.body.published ? new Date() : undefined,
      });
      sendSuccess(res, post, 'Post created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      if (data.published && !data.publishedAt) {
        data.publishedAt = new Date();
      }
      const post = await BlogPost.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!post) throw new AppError('Post not found', 404);
      sendSuccess(res, post, 'Post updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const post = await BlogPost.findByIdAndDelete(req.params.id);
      if (!post) throw new AppError('Post not found', 404);
      sendSuccess(res, null, 'Post deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const blogController = new BlogController();
