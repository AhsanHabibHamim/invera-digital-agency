import SalesPipeline from './pipeline.model';
import SalesTarget from './target.model';
import Commission from './commission.model';
import { AppError } from '../../middleware/errorHandler';

export class SalesService {
  // Pipeline
  async getPipelines() {
    return SalesPipeline.find({ isActive: true }).sort({ name: 1 });
  }

  async createPipeline(data: { name: string; stages: { name: string; order: number; color?: string }[] }) {
    return SalesPipeline.create(data);
  }

  async updatePipeline(id: string, data: any) {
    const pipeline = await SalesPipeline.findByIdAndUpdate(id, data, { new: true });
    if (!pipeline) throw new AppError('Pipeline not found', 404);
    return pipeline;
  }

  async deletePipeline(id: string) {
    const pipeline = await SalesPipeline.findByIdAndDelete(id);
    if (!pipeline) throw new AppError('Pipeline not found', 404);
  }

  // Targets
  async getTargets(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      SalesTarget.find(filters).populate('userId', 'name email').sort({ startDate: -1 }).skip(skip).limit(limit),
      SalesTarget.countDocuments(filters),
    ]);
    return { records, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createTarget(data: any) {
    return SalesTarget.create(data);
  }

  async updateTarget(id: string, data: any) {
    const target = await SalesTarget.findByIdAndUpdate(id, data, { new: true });
    if (!target) throw new AppError('Target not found', 404);
    return target;
  }

  async deleteTarget(id: string) {
    const target = await SalesTarget.findByIdAndDelete(id);
    if (!target) throw new AppError('Target not found', 404);
  }

  // Commissions
  async getCommissions(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Commission.find(filters).populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Commission.countDocuments(filters),
    ]);
    return { records, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createCommission(data: any) {
    return Commission.create(data);
  }

  async approveCommission(id: string) {
    const commission = await Commission.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    if (!commission) throw new AppError('Commission not found', 404);
    return commission;
  }

  async markPaid(id: string) {
    const commission = await Commission.findByIdAndUpdate(id, { status: 'paid', paidAt: new Date() }, { new: true });
    if (!commission) throw new AppError('Commission not found', 404);
    return commission;
  }

  async getSalesStats() {
    const [totalTargets, activeTargets, pendingCommissions, approvedCommissions] = await Promise.all([
      SalesTarget.countDocuments(),
      SalesTarget.countDocuments({ endDate: { $gte: new Date() } }),
      Commission.countDocuments({ status: 'pending' }),
      Commission.countDocuments({ status: 'approved' }),
    ]);
    return { totalTargets, activeTargets, pendingCommissions, approvedCommissions };
  }
}

export const salesService = new SalesService();
