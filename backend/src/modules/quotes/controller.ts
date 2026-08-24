import { Response, NextFunction } from 'express';
import Quote from './model';
import Invoice from '../invoices/model';
import Project from '../projects/model';
import ActivityLog from '../activity_log/model';
import Notification from '../notifications/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { escapeRegex } from '../../utils/text';

function generateQuoteNumber(): string {
  const prefix = 'QTE';
  const num = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}-${num}`;
}

export class QuoteController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
      const filter: any = {};
      if (req.user!.role === 'client') filter.clientId = req.user!._id;
      if (status && status !== 'all') filter.status = status;
      if (search && search.trim()) {
        filter.quoteNumber = new RegExp(escapeRegex(search.trim()), 'i');
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

      const [quotes, total] = await Promise.all([
        Quote.find(filter)
          .populate('clientId', 'name email company')
          .populate('projectId', 'title')
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Quote.countDocuments(filter),
      ]);
      sendSuccess(res, {
        quotes,
        total,
        page: pageNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quote = await Quote.findById(req.params.id)
        .populate('clientId', 'name email company')
        .populate('projectId', 'title');
      if (!quote) throw new AppError('Quote not found', 404);
      if (req.user!.role === 'client' && quote.clientId._id.toString() !== req.user!._id.toString()) {
        throw new AppError('Access denied', 403);
      }
      sendSuccess(res, quote);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const total = req.body.lineItems.reduce((sum: number, item: any) => sum + item.qty * item.price, 0);
      const quote = await Quote.create({
        ...req.body,
        quoteNumber: generateQuoteNumber(),
        total,
      });

      // Update project status to quoted
      if (req.body.projectId) {
        await Project.findByIdAndUpdate(req.body.projectId, { status: 'quoted' });
      }

      await Notification.create({
        userId: req.body.clientId,
        type: 'quote_sent',
        message: `Quote #${quote.quoteNumber} has been generated`,
        link: `/client/projects/${req.body.projectId}`,
      });

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'create_quote',
        targetType: 'Quote',
        targetId: quote._id.toString(),
        details: `Created quote #${quote.quoteNumber} for $${total}`,
      });

      sendSuccess(res, quote, 'Quote created', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      if (data.lineItems) {
        data.total = data.lineItems.reduce((sum: number, item: any) => sum + item.qty * item.price, 0);
      }
      const quote = await Quote.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!quote) throw new AppError('Quote not found', 404);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_quote',
        targetType: 'Quote',
        targetId: quote._id.toString(),
      });
      sendSuccess(res, quote, 'Quote updated');
    } catch (error) {
      next(error);
    }
  }

  async sendQuote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quote = await Quote.findByIdAndUpdate(
        req.params.id,
        { status: 'sent', validUntil: req.body.validUntil },
        { new: true }
      );
      if (!quote) throw new AppError('Quote not found', 404);

      await Notification.create({
        userId: quote.clientId,
        type: 'quote_sent',
        message: `Quote #${quote.quoteNumber} has been sent to you`,
        link: `/client/projects/${quote.projectId}`,
      });

      sendSuccess(res, quote, 'Quote sent');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quote = await Quote.findById(req.params.id);
      if (!quote) throw new AppError('Quote not found', 404);
      if (quote.status === 'accepted') {
        throw new AppError('Cannot delete an accepted quote', 400);
      }
      await Quote.findByIdAndDelete(req.params.id);
      await ActivityLog.create({
        userId: req.user!._id,
        action: 'delete_quote',
        targetType: 'Quote',
        targetId: req.params.id,
      });
      sendSuccess(res, null, 'Quote deleted');
    } catch (error) {
      next(error);
    }
  }

  async convertToInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quote = await Quote.findById(req.params.id);
      if (!quote) throw new AppError('Quote not found', 404);

      const invoice = await Invoice.create({
        clientId: quote.clientId,
        projectId: quote.projectId,
        quoteId: quote._id,
        invoiceNumber: `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        lineItems: quote.lineItems,
        total: quote.total,
        status: 'draft',
      });

      quote.status = 'converted';
      await quote.save();

      await Notification.create({
        userId: quote.clientId,
        type: 'invoice_created',
        message: `Invoice #${invoice.invoiceNumber} has been generated from your quote`,
        link: `/client/invoices/${invoice._id}`,
      });

      sendSuccess(res, { quote, invoice }, 'Quote converted to invoice');
    } catch (error) {
      next(error);
    }
  }
}

export const quoteController = new QuoteController();
