import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from './model';
import UserRole from './userRole.model';
import ActivityLog from '../activity_log/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class UserController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role, isActive, page = '1', limit = '20' } = req.query;
      const filter: any = {};
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        User.find(filter).select('-passwordHash -refreshToken -resetPasswordOTP -resetPasswordOTPExpires').skip(skip).limit(limitNum).sort({ createdAt: -1 }),
        User.countDocuments(filter),
      ]);

      sendSuccess(res, { users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id).select('-passwordHash -refreshToken -resetPasswordOTP -resetPasswordOTPExpires');
      if (!user) throw new AppError('User not found', 404);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.body.role === 'super_admin' && req.user!.role !== 'super_admin') {
        throw new AppError('Only Super Admin can assign this role', 403);
      }

      const existing = await User.findOne({ email: req.body.email });
      if (existing) throw new AppError('Email already registered', 400);

      const plainPassword = req.body.password || crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(plainPassword, 12);
      const user = await User.create({ ...req.body, passwordHash });

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'create_user',
        targetType: 'User',
        targetId: user._id.toString(),
        details: `Created user ${user.name} (${user.role})`,
      });

      sendSuccess(res, { id: user._id, name: user.name, email: user.email, role: user.role }, 'User created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError('User not found', 404);

      if (user.role === 'super_admin' && req.user!.role !== 'super_admin') {
        throw new AppError('Only Super Admin can modify a Super Admin account', 403);
      }
      if (req.body.role === 'super_admin' && req.user!.role !== 'super_admin') {
        throw new AppError('Only Super Admin can assign this role', 403);
      }

      const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-passwordHash -refreshToken -resetPasswordOTP -resetPasswordOTPExpires');
      if (!updated) throw new AppError('User not found', 404);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_user',
        targetType: 'User',
        targetId: updated._id.toString(),
        details: `Updated user ${updated.name}`,
      });

      sendSuccess(res, updated, 'User updated');
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError('User not found', 404);
      if (user.role === 'super_admin' && req.user!.role !== 'super_admin') {
        throw new AppError('Only Super Admin can deactivate a Super Admin account', 403);
      }

      const updated = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      if (!updated) throw new AppError('User not found', 404);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'deactivate_user',
        targetType: 'User',
        targetId: user._id.toString(),
      });

      sendSuccess(res, null, 'User deactivated');
    } catch (error) {
      next(error);
    }
  }

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const userRoles = await UserRole.find({ userId: req.params.id }).populate('roleId');
      sendSuccess(res, userRoles);
    } catch (error) {
      next(error);
    }
  }

  async assignRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roleId } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError('User not found', 404);
      const existing = await UserRole.findOne({ userId: req.params.id, roleId });
      if (existing) throw new AppError('Role already assigned', 400);
      const ur = await UserRole.create({ userId: req.params.id, roleId });

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'assign_role',
        targetType: 'User',
        targetId: user._id.toString(),
        details: `Assigned role to user ${user.name}`,
      });

      sendSuccess(res, ur, 'Role assigned', 201);
    } catch (error) {
      next(error);
    }
  }

  async removeRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserRole.findOneAndDelete({ userId: req.params.id, roleId: req.params.roleId });
      if (!result) throw new AppError('Role assignment not found', 404);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'remove_role',
        targetType: 'User',
        targetId: req.params.id,
      });

      sendSuccess(res, null, 'Role removed');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
