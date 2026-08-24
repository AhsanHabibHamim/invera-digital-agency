import { Request, Response, NextFunction } from 'express';
import Permission from './model';
import { AppError } from '../../middleware/errorHandler';
import { sendSuccess } from '../../utils/apiResponse';

export class PermissionController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { group, module } = req.query;
      const filter: any = {};
      if (group) filter.group = group;
      if (module) filter.module = module;
      const permissions = await Permission.find(filter).sort({ group: 1, name: 1 });
      sendSuccess(res, permissions);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const permission = await Permission.findById(req.params.id);
      if (!permission) throw new AppError('Permission not found', 404);
      sendSuccess(res, permission);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await Permission.findOne({ slug: req.body.slug });
      if (existing) throw new AppError('Permission with this slug already exists', 400);
      const permission = await Permission.create(req.body);
      sendSuccess(res, permission, 'Permission created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const permission = await Permission.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!permission) throw new AppError('Permission not found', 404);
      sendSuccess(res, permission, 'Permission updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const permission = await Permission.findById(req.params.id);
      if (!permission) throw new AppError('Permission not found', 404);
      if (permission.isSystem) throw new AppError('Cannot delete system permission', 400);
      const RolePermission = (await import('../roles/rolePermission.model')).default;
      await RolePermission.deleteMany({ permissionId: req.params.id });
      await Permission.findByIdAndDelete(req.params.id);
      sendSuccess(res, null, 'Permission deleted');
    } catch (error) {
      next(error);
    }
  }

  async getGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await Permission.distinct('group');
      sendSuccess(res, groups);
    } catch (error) {
      next(error);
    }
  }

  async getModules(req: Request, res: Response, next: NextFunction) {
    try {
      const modules = await Permission.distinct('module');
      sendSuccess(res, modules);
    } catch (error) {
      next(error);
    }
  }
}

export const permissionController = new PermissionController();
