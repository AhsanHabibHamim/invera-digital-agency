import { Request, Response, NextFunction } from 'express';
import { roleService } from './service';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';

export class RoleController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.query;
      const filter: any = {};
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      const roles = await roleService.getAll(filter);
      sendSuccess(res, roles);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.getById(req.params.id);
      sendSuccess(res, role);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.create(req.body);
      sendSuccess(res, role, 'Role created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.update(req.params.id, req.body);
      sendSuccess(res, role, 'Role updated');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await roleService.remove(req.params.id);
      sendSuccess(res, null, 'Role deleted');
    } catch (error) {
      next(error);
    }
  }

  async clone(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug } = req.body;
      const role = await roleService.clone(req.params.id, name, slug);
      sendSuccess(res, role, 'Role cloned', 201);
    } catch (error) {
      next(error);
    }
  }

  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await roleService.getPermissions(req.params.id);
      sendSuccess(res, permissions);
    } catch (error) {
      next(error);
    }
  }

  async assignPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissionId } = req.body;
      const rp = await roleService.assignPermission(req.params.id, permissionId);
      sendSuccess(res, rp, 'Permission assigned', 201);
    } catch (error) {
      next(error);
    }
  }

  async removePermission(req: Request, res: Response, next: NextFunction) {
    try {
      await roleService.removePermission(req.params.id, req.params.permissionId);
      sendSuccess(res, null, 'Permission removed');
    } catch (error) {
      next(error);
    }
  }
}

export const roleController = new RoleController();
