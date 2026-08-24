import { Request, Response, NextFunction } from 'express';
import { leadService } from './service';
import { AuthRequest } from '../../middleware/authGuard';
import ActivityLog from '../activity_log/model';
import Notification from '../notifications/model';
import User from '../users/model';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { sendNewLeadAdminEmail, sendLeadAssignedEmail } from '../../services/email.service';

export class LeadController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, source, assignedTo, priority, page = '1', limit = '20', search } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (search) {
        const result = await leadService.search(search as string, pageNum, limitNum);
        return sendSuccess(res, result);
      }

      const filter: any = {};
      if (status) filter.status = status;
      if (source) filter.source = source;
      if (assignedTo) filter.assignedTo = assignedTo;
      if (priority) filter.priority = priority;

      const result = await leadService.getAll(filter, pageNum, limitNum);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const lead = await leadService.getById(req.params.id);
      sendSuccess(res, lead);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Public contact form: never let the caller set privileged fields.
      const body = { ...req.body };
      const isInternal = !!req.user;

      if (!isInternal) {
        delete body.status;
        delete body.priority;
        delete body.assignedTo;
        delete body.createdBy;
        delete body.leadScore;
        delete body.probability;
        delete body.estimatedDealValue;
        delete body.expectedCloseDate;
        delete body.adminNotes;
        delete body.tags;
      }

      const lead = await leadService.create(body, req.user?._id);

      if (!isInternal) {
        try {
          const { settingsService } = await import('../settings/service');
          const automation = await settingsService.getAutomationConfig();
          if (automation.autoAssignLeads && automation.salesAssigneeIds.length > 0) {
            // Round-robin across the configured sales team.
            const idx = Math.abs(Date.now()) % automation.salesAssigneeIds.length;
            const assigneeId = automation.salesAssigneeIds[idx];
            const assignee = await User.findById(assigneeId).select('name email');
            if (assignee) {
              await leadService.assignLead(lead._id.toString(), assigneeId);
              await Notification.create({
                userId: assigneeId,
                type: 'lead_assigned',
                message: `New lead auto-assigned to you: ${lead.contactName}`,
                link: `/dashboard/leads`,
              });
              const { sendLeadAssignedEmail } = await import('../../services/email.service');
              await sendLeadAssignedEmail(
                assignee.email,
                assignee.name,
                lead.contactName,
                lead.email,
                lead.serviceInterest || '',
              );
            }
          }
        } catch (err) {
          console.warn('[automation] Lead auto-assign failed:', err);
        }

        // Notify admins about the new inbound lead.
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true }).select('email');
        for (const admin of admins) {
          await sendNewLeadAdminEmail(admin.email, lead.contactName, lead.email, lead.serviceInterest || '');
        }
      }

      sendSuccess(res, lead, 'Lead created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lead = await leadService.update(req.params.id, req.body);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_lead',
        targetType: 'Lead',
        targetId: lead._id.toString(),
        details: `Lead updated: ${lead.contactName}`,
      });
      sendSuccess(res, lead, 'Lead updated');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lead = await leadService.updateStatus(req.params.id, req.body.status);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_lead_status',
        targetType: 'Lead',
        targetId: lead._id.toString(),
        details: `Lead status changed to ${req.body.status}`,
      });
      sendSuccess(res, lead, 'Lead status updated');
    } catch (error) {
      next(error);
    }
  }

  async assignLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lead = await leadService.assignLead(req.params.id, req.body.userId);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'assign_lead',
        targetType: 'Lead',
        targetId: lead._id.toString(),
        details: `Lead assigned to ${(lead.assignedTo as any)?.name || req.body.userId}`,
      });
      sendSuccess(res, lead, 'Lead assigned');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await leadService.remove(req.params.id);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'delete_lead',
        targetType: 'Lead',
        targetId: req.params.id,
      });
      sendSuccess(res, null, 'Lead deleted');
    } catch (error) {
      next(error);
    }
  }

  async bulkAction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, action, data } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError('ids array is required', 400);
      }

      let result;
      if (action === 'delete') {
        result = await leadService.bulkDelete(ids);
      } else if (action === 'update' && data) {
        result = await leadService.bulkUpdate(ids, data);
      } else {
        throw new AppError('Invalid bulk action', 400);
      }

      await ActivityLog.create({
        userId: req.user!._id,
        action: `bulk_${action}_leads`,
        targetType: 'Lead',
        details: `Bulk ${action} on ${ids.length} leads`,
      });

      sendSuccess(res, result, `Bulk ${action} completed`);
    } catch (error) {
      next(error);
    }
  }

  async convertToClient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await leadService.convertToClient(req.params.id);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'convert_lead',
        targetType: 'Lead',
        targetId: req.params.id,
        details: `Lead converted to client: ${result.user.name}`,
      });
      sendSuccess(res, result, 'Lead converted to client');
    } catch (error) {
      next(error);
    }
  }

  async reply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      if (!message) throw new AppError('Message is required', 400);

      const lead = await leadService.addReply(req.params.id, req.user!._id, message);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'reply_lead',
        targetType: 'Lead',
        targetId: req.params.id,
        details: `Replied to lead: ${lead.contactName}`,
      });

      const matchedUser = await User.findOne({ email: lead.email });
      if (matchedUser) {
        await Notification.create({
          userId: matchedUser._id,
          type: 'lead_reply',
          message: `You have a new reply regarding "${lead.serviceInterest || 'your inquiry'}"`,
          link: `/contact`,
        });
      }

      sendSuccess(res, lead, 'Reply sent');
    } catch (error) {
      next(error);
    }
  }

  async addCommunication(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, content } = req.body;
      if (!type || !content) throw new AppError('type and content are required', 400);
      const lead = await leadService.addCommunication(req.params.id, req.user!._id, type, content);
      sendSuccess(res, lead, 'Communication added');
    } catch (error) {
      next(error);
    }
  }

  async addFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { fileName, fileUrl } = req.body;
      if (!fileName || !fileUrl) throw new AppError('fileName and fileUrl are required', 400);
      const lead = await leadService.addFile(req.params.id, req.user!._id, fileName, fileUrl);
      sendSuccess(res, lead, 'File added');
    } catch (error) {
      next(error);
    }
  }

  async getByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20' } = req.query;
      const result = await leadService.getByStatus(req.params.status, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMyLeads(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20' } = req.query;
      const result = await leadService.getByAssignee(req.user!._id, parseInt(page as string), parseInt(limit as string));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();
