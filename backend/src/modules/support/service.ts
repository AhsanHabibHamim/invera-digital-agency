import Ticket from './ticket.model';
import SupportCategory from './category.model';
import Notification from '../notifications/model';
import { AppError } from '../../middleware/errorHandler';

export class SupportService {
  async getAllTickets(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [tickets, total] = await Promise.all([
      Ticket.find(filters)
        .populate('clientId', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(filters),
    ]);
    return { tickets, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getTicketById(id: string) {
    const ticket = await Ticket.findById(id)
      .populate('clientId', 'name email company phone')
      .populate('assignedTo', 'name email')
      .populate('replies.createdBy', 'name email');
    if (!ticket) throw new AppError('Ticket not found', 404);
    return ticket;
  }

  async createTicket(data: any) {
    return Ticket.create(data);
  }

  async updateTicket(id: string, data: any) {
    const ticket = await Ticket.findByIdAndUpdate(id, data, { new: true });
    if (!ticket) throw new AppError('Ticket not found', 404);
    return ticket;
  }

  async assignTicket(id: string, userId: string) {
    const ticket = await Ticket.findByIdAndUpdate(id, { assignedTo: userId, status: 'in_progress' }, { new: true })
      .populate('assignedTo', 'name email');
    if (!ticket) throw new AppError('Ticket not found', 404);

    if (ticket.assignedTo) {
      await Notification.create({
        userId: userId as any,
        type: 'ticket_assigned',
        message: `Ticket "${ticket.title}" has been assigned to you`,
        link: `/support/tickets/${ticket._id}`,
      });
    }

    return ticket;
  }

  async addReply(ticketId: string, userId: string, message: string, attachments: string[] = []) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);

    const User = (await import('../users/model')).default;
    const replier = await User.findById(userId).select('role name');
    const isStaff = !!replier && replier.role !== 'client';

    ticket.replies.push({
      message,
      createdBy: userId as any,
      isStaffReply: isStaff,
      attachments,
      createdAt: new Date(),
    } as any);

    if (ticket.status === 'closed') ticket.status = 'open';
    if (ticket.status === 'waiting_on_client') ticket.status = 'in_progress';
    await ticket.save();

    const notifyUserId = ticket.clientId.toString() === userId ? ticket.assignedTo : ticket.clientId;
    if (notifyUserId) {
      await Notification.create({
        userId: notifyUserId,
        type: 'ticket_reply',
        message: `New reply on ticket "${ticket.title}"`,
        link: `/support/tickets/${ticket._id}`,
      });
    }

    return ticket;
  }

  async closeTicket(id: string) {
    const ticket = await Ticket.findByIdAndUpdate(id, { status: 'closed', closedAt: new Date() }, { new: true });
    if (!ticket) throw new AppError('Ticket not found', 404);
    return ticket;
  }

  async getCategories() {
    return SupportCategory.find({ isActive: true }).sort({ name: 1 });
  }

  async createCategory(data: { name: string; slug: string; description?: string }) {
    const existing = await SupportCategory.findOne({ slug: data.slug });
    if (existing) throw new AppError('Category with this slug already exists', 400);
    return SupportCategory.create(data);
  }

  async updateCategory(id: string, data: any) {
    const cat = await SupportCategory.findByIdAndUpdate(id, data, { new: true });
    if (!cat) throw new AppError('Category not found', 404);
    return cat;
  }

  async deleteCategory(id: string) {
    const cat = await SupportCategory.findByIdAndDelete(id);
    if (!cat) throw new AppError('Category not found', 404);
  }

  async getTicketStats() {
    const [open, inProgress, waiting, resolved, closed, total] = await Promise.all([
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: 'waiting_on_client' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ status: 'closed' }),
      Ticket.countDocuments(),
    ]);
    return { open, inProgress, waiting, resolved, closed, total };
  }
}

export const supportService = new SupportService();
