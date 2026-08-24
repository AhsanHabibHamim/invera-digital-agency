import { Response, NextFunction } from 'express';
import Project from '../projects/model';
import Invoice from '../invoices/model';
import Lead from '../leads/model';
import User from '../users/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { ttlCache } from '../../utils/cache';

export class AnalyticsController {
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cached = ttlCache.get<any>('analytics-dashboard');
      if (cached) {
        sendSuccess(res, cached);
        return;
      }

      const [activeProjects, totalProjects, totalRevenue, outstandingRevenue, totalLeads, totalClients, teamCount] =
        await Promise.all([
          Project.countDocuments({ status: { $in: ['in_progress', 'in_review'] } }),
          Project.countDocuments(),
          Invoice.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ]),
          Invoice.aggregate([
            { $match: { status: { $in: ['sent', 'overdue'] } } },
            { $group: { _id: null, total: { $sum: '$total' } } },
          ]),
          Lead.countDocuments(),
          User.countDocuments({ role: 'client', isActive: true }),
          User.countDocuments({ role: 'team', isActive: true }),
        ]);

      const leadConversion = totalLeads > 0
        ? Math.round((await Lead.countDocuments({ status: 'converted' })) / totalLeads * 100)
        : 0;

      const projectsByStatus = await Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const revenueByMonth = await Invoice.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
            total: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]);

      const payload = {
        activeProjects,
        totalProjects,
        totalRevenue: totalRevenue[0]?.total || 0,
        outstandingRevenue: outstandingRevenue[0]?.total || 0,
        totalLeads,
        totalClients,
        teamCount,
        leadConversion,
        projectsByStatus,
        revenueByMonth,
      };

      // Cache for 2 minutes — this endpoint aggregates ~9 collection scans.
      ttlCache.set('analytics-dashboard', payload, 120);

      sendSuccess(res, payload);
    } catch (error) {
      next(error);
    }
  }

  async getTeamWorkload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workload = await Project.aggregate([
        { $match: { status: { $in: ['in_progress', 'in_review'] } } },
        { $unwind: '$assignedTeam' },
        { $group: { _id: '$assignedTeam', projectCount: { $sum: 1 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            projectCount: 1,
          },
        },
      ]);

      sendSuccess(res, workload);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
