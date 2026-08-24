import Role from './model';
import RolePermission from './rolePermission.model';
import { AppError } from '../../middleware/errorHandler';

export class RoleService {
  async getAll(filters: any = {}) {
    return Role.find(filters).sort({ name: 1 });
  }

  async getById(id: string) {
    const role = await Role.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    return role;
  }

  async getBySlug(slug: string) {
    const role = await Role.findOne({ slug });
    if (!role) throw new AppError('Role not found', 404);
    return role;
  }

  async create(data: { name: string; slug: string; description?: string; isSystem?: boolean }) {
    const existing = await Role.findOne({ slug: data.slug });
    if (existing) throw new AppError('Role with this slug already exists', 400);
    return Role.create(data);
  }

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const role = await Role.findByIdAndUpdate(id, data, { new: true });
    if (!role) throw new AppError('Role not found', 404);
    return role;
  }

  async remove(id: string) {
    const role = await Role.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    if (role.isSystem) throw new AppError('Cannot delete system role', 400);
    await RolePermission.deleteMany({ roleId: id });
    await Role.findByIdAndDelete(id);
  }

  async clone(id: string, name: string, slug: string) {
    const source = await Role.findById(id);
    if (!source) throw new AppError('Source role not found', 404);
    const existing = await Role.findOne({ slug });
    if (existing) throw new AppError('Role with this slug already exists', 400);
    const newRole = await Role.create({ name, slug, description: `Cloned from ${source.name}` });
    const perms = await RolePermission.find({ roleId: id });
    if (perms.length > 0) {
      await RolePermission.insertMany(perms.map(p => ({ roleId: newRole._id, permissionId: p.permissionId })));
    }
    return newRole;
  }

  async getPermissions(roleId: string) {
    return RolePermission.find({ roleId }).populate('permissionId');
  }

  async assignPermission(roleId: string, permissionId: string) {
    const existing = await RolePermission.findOne({ roleId, permissionId });
    if (existing) throw new AppError('Permission already assigned to this role', 400);
    return RolePermission.create({ roleId, permissionId });
  }

  async removePermission(roleId: string, permissionId: string) {
    const result = await RolePermission.findOneAndDelete({ roleId, permissionId });
    if (!result) throw new AppError('Permission not assigned to this role', 404);
  }
}

export const roleService = new RoleService();
