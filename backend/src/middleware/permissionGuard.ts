import { Response, NextFunction } from 'express';
import { AuthRequest } from './authGuard';
import { sendError } from '../utils/apiResponse';
import UserRole from '../modules/users/userRole.model';
import RolePermission from '../modules/roles/rolePermission.model';
import Permission from '../modules/permissions/model';

// Permission slugs granted to a user through their assigned roles.
// super_admin is handled by hasPermission() before this is needed.
export async function loadUserPermissionSlugs(userId: unknown): Promise<Set<string>> {
  const userRoles = await UserRole.find({ userId }).select('roleId');
  const roleIds = userRoles.map((ur) => ur.roleId);
  if (!roleIds.length) return new Set();

  const rolePerms = await RolePermission.find({ roleId: { $in: roleIds } }).select('permissionId');
  const permIds = rolePerms.map((rp) => rp.permissionId);
  if (!permIds.length) return new Set();

  const perms = await Permission.find({ _id: { $in: permIds } }).select('slug');
  return new Set(perms.map((p) => p.slug));
}

/**
 * Guards a route by permission slug. The super_admin automatically holds
 * EVERY permission — including ones created in the future — so they can
 * always cover for any absent role (HR, sales, project manager, ...).
 *
 * Usage: router.delete('/:id', authGuard, hasPermission('delete_leads'), ctrl.remove)
 */
export function hasPermission(...required: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      // Full override: the most powerful admin can perform every role's work.
      if (req.user.role === 'super_admin') {
        return next();
      }

      const slugs = await loadUserPermissionSlugs(req.user._id);
      if (required.some((slug) => slugs.has(slug))) {
        return next();
      }

      return sendError(res, 'Insufficient permissions', 403);
    } catch (error) {
      next(error);
    }
  };
}
