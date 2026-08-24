import Attendance from './attendance.model';
import Leave from './leave.model';
import JobApplication from './recruitment.model';
import { AppError } from '../../middleware/errorHandler';

export class HRService {
  // Attendance
  async getAttendance(filters: any = {}, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Attendance.find(filters).populate('userId', 'name email').sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filters),
    ]);
    return { records, total, page, totalPages: Math.ceil(total / limit) };
  }

  async checkIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({ userId, date: today });
    if (existing) throw new AppError('Already checked in today', 400);

    const now = new Date();
    const hour = now.getHours();
    const status = hour >= 9 ? 'late' : 'present';

    return Attendance.create({ userId, date: today, checkIn: now, status });
  }

  async checkOut(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await Attendance.findOne({ userId, date: today });
    if (!record) throw new AppError('No check-in record found for today', 400);
    if (record.checkOut) throw new AppError('Already checked out today', 400);

    record.checkOut = new Date();
    await record.save();
    return record;
  }

  // Leave
  async getLeaves(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Leave.find(filters).populate('userId', 'name email').populate('approvedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Leave.countDocuments(filters),
    ]);
    return { records, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createLeave(data: any) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    data.totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Leave.create(data);
  }

  async approveLeave(id: string, approvedBy: string, status: 'approved' | 'rejected', notes?: string) {
    const leave = await Leave.findByIdAndUpdate(id, { status, approvedBy, approvedAt: new Date(), notes }, { new: true });
    if (!leave) throw new AppError('Leave request not found', 404);
    return leave;
  }

  // Recruitment
  async getApplications(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      JobApplication.find(filters).populate('interviewer', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      JobApplication.countDocuments(filters),
    ]);
    return { records, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createApplication(data: any) {
    return JobApplication.create(data);
  }

  async updateApplication(id: string, data: any) {
    const app = await JobApplication.findByIdAndUpdate(id, data, { new: true });
    if (!app) throw new AppError('Application not found', 404);
    return app;
  }

  async deleteApplication(id: string) {
    const app = await JobApplication.findByIdAndDelete(id);
    if (!app) throw new AppError('Application not found', 404);
  }

  async getHRStats() {
    const [totalEmployees, activeLeaves, pendingLeaves, newApplications] = await Promise.all([
      (await import('../users/model')).default.countDocuments({ isActive: true, role: { $in: ['admin', 'team', 'super_admin'] } }),
      Leave.countDocuments({ status: 'approved', startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }),
      Leave.countDocuments({ status: 'pending' }),
      JobApplication.countDocuments({ status: 'new' }),
    ]);
    return { totalEmployees, activeLeaves, pendingLeaves, newApplications };
  }
}

export const hrService = new HRService();
