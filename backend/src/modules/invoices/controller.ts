import { Response, NextFunction } from 'express';
import Invoice from './model';
import ActivityLog from '../activity_log/model';
import Notification from '../notifications/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { env } from '../../config/env';
import { validateDiscountCode } from '../../services/discount.service';
import { escapeRegex } from '../../utils/text';
import {
  sendInvoiceCreatedEmail,
} from '../../services/email.service';

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  bkash: 'bKash',
  nagad: 'Nagad',
  other: 'Manual / Other',
};

// Module-level helper. Route handlers reference controller methods unbound
// (e.g. `invoiceController.getById`), so `this` is undefined at runtime.
function assertClientOwnership(req: AuthRequest, invoice: { clientId?: { _id?: unknown; toString(): string } | unknown }) {
  if (req.user!.role !== 'client') return;
  const owner = invoice.clientId as { _id?: unknown; toString(): string } | undefined;
  const ownerId = (owner?._id ?? owner)?.toString();
  if (ownerId !== req.user!._id.toString()) {
    throw new AppError('Access denied', 403);
  }
}

export class InvoiceController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
      const filter: any = {};
      if (req.user!.role === 'client') filter.clientId = req.user!._id;
      if (status && status !== 'all') filter.status = status;
      if (search && search.trim()) {
        const rx = new RegExp(escapeRegex(search.trim()), 'i');
        filter.$or = [{ invoiceNumber: rx }];
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

      const [invoices, total] = await Promise.all([
        Invoice.find(filter)
          .populate('clientId', 'name email company')
          .populate('projectId', 'title')
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Invoice.countDocuments(filter),
      ]);

      sendSuccess(res, {
        invoices,
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
      const invoice = await Invoice.findById(req.params.id)
        .populate('clientId', 'name email company')
        .populate('projectId', 'title');
      if (!invoice) throw new AppError('Invoice not found', 404);
      assertClientOwnership(req, invoice);
      sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const total = req.body.lineItems.reduce((sum: number, item: any) => sum + item.qty * item.price, 0);

      let discountAmount = 0;
      if (req.body.discountCode) {
        const result = validateDiscountCode(req.body.discountCode, total);
        if (result.valid) {
          discountAmount = result.discountAmount;
        }
      }

      const invoice = await Invoice.create({
        ...req.body,
        invoiceNumber: `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        total: total - discountAmount,
        discountAmount,
      });

      await Notification.create({
        userId: req.body.clientId,
        type: 'invoice_created',
        message: `Invoice #${invoice.invoiceNumber} has been generated for $${total}`,
        link: `/client/invoices/${invoice._id}`,
      });

      const client = await import('../users/model').then((m) =>
        m.default.findById(req.body.clientId).select('name email'),
      );
      if (client?.email) {
        await sendInvoiceCreatedEmail(
          client.email,
          client.name,
          invoice.invoiceNumber,
          invoice.total,
          `${env.frontendUrl}/client/invoices/${invoice._id}`,
        );
      }

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'create_invoice',
        targetType: 'Invoice',
        targetId: invoice._id.toString(),
      });

      sendSuccess(res, invoice, 'Invoice created', 201);
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
      delete data.paidAt;
      delete data.status;
      delete data.paymentMethod;
      delete data.confirmedByName;
      const invoice = await Invoice.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!invoice) throw new AppError('Invoice not found', 404);

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'update_invoice',
        targetType: 'Invoice',
        targetId: invoice._id.toString(),
      });
      sendSuccess(res, invoice, 'Invoice updated');
    } catch (error) {
      next(error);
    }
  }

  async sendInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dueDate = req.body.dueDate && req.body.dueDate !== ''
        ? new Date(req.body.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const invoice = await Invoice.findByIdAndUpdate(
        req.params.id,
        { status: 'sent', dueDate },
        { new: true, runValidators: true }
      );
      if (!invoice) throw new AppError('Invoice not found', 404);

      await Notification.create({
        userId: invoice.clientId,
        type: 'invoice_sent',
        message: `Invoice #${invoice.invoiceNumber} has been sent`,
        link: `/client/invoices/${invoice._id}`,
      });

      const client = await import('../users/model').then((m) =>
        m.default.findById(invoice.clientId).select('name email'),
      );
      if (client?.email) {
        await sendInvoiceCreatedEmail(
          client.email,
          client.name,
          invoice.invoiceNumber,
          invoice.total,
          `${env.frontendUrl}/client/invoices/${invoice._id}`,
        );
      }

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'send_invoice',
        targetType: 'Invoice',
        targetId: invoice._id.toString(),
      });

      sendSuccess(res, invoice, 'Invoice sent');
    } catch (error) {
      next(error);
    }
  }

  async voidInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) throw new AppError('Invoice not found', 404);
      if (invoice.status === 'paid') {
        throw new AppError('Cannot void a paid invoice', 400);
      }
      invoice.status = 'cancelled';
      await invoice.save();

      await ActivityLog.create({
        userId: req.user!._id,
        action: 'void_invoice',
        targetType: 'Invoice',
        targetId: invoice._id.toString(),
      });
      sendSuccess(res, invoice, 'Invoice cancelled');
    } catch (error) {
      next(error);
    }
  }

  async generatePDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await Invoice.findById(req.params.id).populate('clientId', 'name email company');
      if (!invoice) throw new AppError('Invoice not found', 404);
      assertClientOwnership(req, invoice);

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      const currencySymbol = invoice.currency === 'BDT' ? '৳' : '$';
      const money = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

      // Header
      page.drawText('INVERA', { x: 50, y: height - 50, size: 24, font: fontBold, color: rgb(0.48, 0.23, 0.93) });
      page.drawText('Digital Agency', { x: 50, y: height - 70, size: 12, font, color: rgb(0.58, 0.58, 0.72) });

      page.drawText(`INVOICE #${invoice.invoiceNumber}`, { x: width - 200, y: height - 50, size: 18, font: fontBold });
      page.drawText(`Status: ${invoice.status.toUpperCase()}`, { x: width - 200, y: height - 70, size: 10, font });

      // Divider
      page.drawLine({ start: { x: 50, y: height - 90 }, end: { x: width - 50, y: height - 90 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

      // Client info
      let yPos = height - 120;
      page.drawText('Bill To:', { x: 50, y: yPos, size: 12, font: fontBold });
      yPos -= 20;
      const client = invoice.clientId as any;
      page.drawText(client.name || 'Client', { x: 50, y: yPos, size: 11, font });
      yPos -= 16;
      page.drawText(client.email || '', { x: 50, y: yPos, size: 11, font });
      yPos -= 16;
      if (client.company) {
        page.drawText(client.company, { x: 50, y: yPos, size: 11, font });
        yPos -= 16;
      }

      // Invoice details
      page.drawText(`Date: ${invoice.createdAt.toLocaleDateString()}`, { x: width - 200, y: height - 120, size: 10, font });
      page.drawText(`Due Date: ${invoice.dueDate?.toLocaleDateString() || 'N/A'}`, { x: width - 200, y: height - 136, size: 10, font });
      if (invoice.currency) page.drawText(`Currency: ${invoice.currency}`, { x: width - 200, y: height - 152, size: 10, font });

      // Line items header
      yPos -= 30;
      page.drawLine({ start: { x: 50, y: yPos }, end: { x: width - 50, y: yPos }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      yPos -= 20;
      page.drawText('Description', { x: 50, y: yPos, size: 10, font: fontBold });
      page.drawText('Qty', { x: 350, y: yPos, size: 10, font: fontBold });
      page.drawText('Price', { x: 420, y: yPos, size: 10, font: fontBold });
      page.drawText('Total', { x: 500, y: yPos, size: 10, font: fontBold });
      yPos -= 10;
      page.drawLine({ start: { x: 50, y: yPos }, end: { x: width - 50, y: yPos }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

      // Line items
      for (const item of invoice.lineItems) {
        yPos -= 20;
        page.drawText(item.description, { x: 50, y: yPos, size: 10, font });
        page.drawText(String(item.qty), { x: 350, y: yPos, size: 10, font });
        page.drawText(money(item.price), { x: 420, y: yPos, size: 10, font });
        page.drawText(money(item.qty * item.price), { x: 500, y: yPos, size: 10, font });

        if (yPos < 100) {
          page = pdfDoc.addPage([612, 792]);
          yPos = page.getSize().height - 50;
        }
      }

      // Total
      yPos -= 30;
      page.drawLine({ start: { x: 350, y: yPos }, end: { x: width - 50, y: yPos }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      yPos -= 20;
      page.drawText(`Total: ${money(invoice.total)}`, { x: 420, y: yPos, size: 14, font: fontBold });

      if (invoice.discountAmount > 0) {
        yPos -= 20;
        page.drawText(`Discount: -${money(invoice.discountAmount)}`, { x: 420, y: yPos, size: 11, font });
      }

      if (invoice.tax > 0) {
        yPos -= 20;
        page.drawText(`Tax: ${money(invoice.tax)}`, { x: 420, y: yPos, size: 11, font });
      }

      // Payment confirmation note
      if (invoice.status === 'paid' && invoice.paymentMethod) {
        const confirmedOn = (invoice.confirmedAt ?? invoice.paidAt ?? invoice.updatedAt)?.toLocaleDateString() || '';
        const confirmedBy = invoice.confirmedByName ? ` — Confirmed by ${invoice.confirmedByName}` : '';
        yPos -= 26;
        page.drawText(
          `Paid via ${METHOD_LABELS[invoice.paymentMethod] || invoice.paymentMethod}${confirmedBy} on ${confirmedOn}`,
          { x: 50, y: yPos, size: 9, font: fontBold, color: rgb(0.08, 0.55, 0.29) },
        );
      }

      const pdfBytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
