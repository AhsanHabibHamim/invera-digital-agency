import { Response, NextFunction } from 'express';
import { supportService } from './service';
import { AuthRequest } from '../../middleware/authGuard';
import ActivityLog from '../activity_log/model';
import User from '../users/model';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import {
  sendTicketCreatedEmail,
  sendTicketReplyEmail,
} from '../../services/email.service';

function ticketUrl(id: string): string {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/tickets/${id}`;
}

export class SupportController {
  async getAllTickets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, priority, category, assignedTo, page = '1', limit = '20' } = req.query;
      const filter: any = {};

      if (req.user!.role === 'client') {
        filter.clientId = req.user!._id;
      }

      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;
      if (assignedTo) filter.assignedTo = assignedTo;

      const result = await supportService.getAllTickets(
        filter,
        parseInt(page as string),
        parseInt(limit as string)
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getTicketById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await supportService.getTicketById(req.params.id);

      if (req.user!.role === 'client' && ticket.clientId._id.toString() !== req.user!._id) {
        throw new AppError('Access denied', 403);
      }

      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  async createTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      if (req.user!.role === 'client') {
        data.clientId = req.user!._id;
      }
      const ticket = await supportService.createTicket(data);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'create_ticket',
        targetType: 'Ticket',
        targetId: ticket._id.toString(),
      });

      // Email confirmation to requester (and admins for client tickets)
      try {
        if (req.user!.email) {
          await sendTicketCreatedEmail(req.user!.email, req.user!.name, ticket.title, ticketUrl(ticket._id.toString()));
        }
      } catch (err) {
        console.warn('[email] Ticket created email failed:', err);
      }

      sendSuccess(res, ticket, 'Ticket created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await supportService.updateTicket(req.params.id, req.body);
      sendSuccess(res, ticket, 'Ticket updated');
    } catch (error) {
      next(error);
    }
  }

  async assignTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await supportService.assignTicket(req.params.id, req.body.userId);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'assign_ticket',
        targetType: 'Ticket',
        targetId: ticket._id.toString(),
      });

      sendSuccess(res, ticket, 'Ticket assigned');
    } catch (error) {
      next(error);
    }
  }

  async reply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message, attachments } = req.body;
      if (!message) throw new AppError('Message is required', 400);

      const ticket = await supportService.addReply(req.params.id, req.user!._id, message, attachments || []);

      // Email fallback: staff reply -> notify client; client reply -> notify assignee
      try {
        const full = (ticket.clientId as any)?._id
          ? ticket
          : await supportService.getTicketById(req.params.id);
        const isStaffReply = req.user!.role !== 'client';
        if (isStaffReply) {
          const clientUser = await User.findById((full.clientId as any)._id ?? full.clientId).select('name email');
          if (clientUser?.email) {
            await sendTicketReplyEmail(clientUser.email, clientUser.name, ticket.title, ticketUrl(ticket._id.toString()));
          }
        } else if ((full as any).assignedTo) {
          const staff = await User.findById((full as any).assignedTo).select('name email');
          if (staff?.email) {
            await sendTicketReplyEmail(staff.email, staff.name, ticket.title, `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/support`);
          }
        }
      } catch (err) {
        console.warn('[email] Ticket reply email failed:', err);
      }

      sendSuccess(res, ticket, 'Reply added');
    } catch (error) {
      next(error);
    }
  }

  async closeTicket(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ticket = await supportService.closeTicket(req.params.id);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'close_ticket',
        targetType: 'Ticket',
        targetId: ticket._id.toString(),
      });

      sendSuccess(res, ticket, 'Ticket closed');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await supportService.getTicketStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await supportService.getCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await supportService.createCategory(req.body);
      sendSuccess(res, category, 'Category created', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await supportService.updateCategory(req.params.id, req.body);
      sendSuccess(res, category, 'Category updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await supportService.deleteCategory(req.params.id);
      sendSuccess(res, null, 'Category deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const supportController = new SupportController();
