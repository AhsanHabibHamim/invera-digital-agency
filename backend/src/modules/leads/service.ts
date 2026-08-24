import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Lead from './model';
import User from '../users/model';
import Proposal from '../proposals/model';
import { AppError } from '../../middleware/errorHandler';
import {
  sendWelcomeEmail,
  sendNewLeadAdminEmail,
} from '../../services/email.service';
import { escapeRegex } from '../../utils/text';

export class LeadService {
  async getAll(filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [leads, total] = await Promise.all([
      Lead.find(filters)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(filters),
    ]);
    return { leads, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const lead = await Lead.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('replies.repliedBy', 'name email')
      .populate('files.uploadedBy', 'name email')
      .populate('communicationHistory.createdBy', 'name email');
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async create(data: any, userId?: string) {
    const createData = { ...data };
    if (userId) createData.createdBy = userId;
    return Lead.create(createData);
  }

  async update(id: string, data: any) {
    const lead = await Lead.findByIdAndUpdate(id, data, { new: true });
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async updateStatus(id: string, status: string) {
    const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true });
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async assignLead(id: string, userId: string) {
    const lead = await Lead.findByIdAndUpdate(id, { assignedTo: userId }, { new: true })
      .populate('assignedTo', 'name email');
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async remove(id: string) {
    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async bulkUpdate(ids: string[], data: any) {
    // Allow-list of mutable fields — never forward raw user data to updateMany
    // (prevents $-operator injection and mass-assignment).
    const allowed = ['status', 'priority', 'source', 'assignedTo', 'tags', 'notes'];
    const safeData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) safeData[key] = data[key];
    }
    if (Object.keys(safeData).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }
    const result = await Lead.updateMany({ _id: { $in: ids } }, safeData);
    return result;
  }

  async bulkDelete(ids: string[]) {
    const result = await Lead.deleteMany({ _id: { $in: ids } });
    return result;
  }

  async convertToClient(leadId: string) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);

    const existing = await User.findOne({ email: lead.email });
    if (existing) throw new AppError('A user with this email already exists', 400);

    const plainPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const user = await User.create({
      name: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      passwordHash,
      role: 'client',
      isEmailVerified: true,
    });

    lead.status = 'converted';
    await lead.save();

    await sendWelcomeEmail(user.email, user.name, plainPassword);

    // Automation: auto-draft a proposal from the qualified lead (admin reviews & sends).
    try {
      const { settingsService } = await import('../settings/service');
      const automation = await settingsService.getAutomationConfig();
      if (automation.autoProposalOnConvert) {
        await Proposal.create({
          clientId: user._id,
          title: lead.serviceInterest || `${lead.contactName} — Project Proposal`,
          description:
            lead.requirements ||
            lead.message ||
            `Proposal drafted from lead ${lead.leadId} (${lead.serviceInterest || 'general inquiry'}).`,
          budgetRange: lead.estimatedDealValue ? `$${lead.estimatedDealValue}` : undefined,
          status: 'submitted',
        });
      }
    } catch (err) {
      console.warn('[automation] Failed to auto-draft proposal on conversion:', err);
    }

    return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, lead };
  }

  async addReply(leadId: string, userId: string, message: string) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);

    lead.replies.push({ message, repliedBy: userId as any, createdAt: new Date() });
    if (lead.status === 'new') lead.status = 'contacted';
    await lead.save();

    return lead;
  }

  async addCommunication(leadId: string, userId: string, type: string, content: string) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);

    lead.communicationHistory.push({ type: type as any, content, createdBy: userId as any, createdAt: new Date() });
    lead.lastContactDate = new Date();
    await lead.save();

    return lead;
  }

  async addFile(leadId: string, userId: string, fileName: string, fileUrl: string) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);

    lead.files.push({ fileName, fileUrl, uploadedBy: userId as any, createdAt: new Date() });
    await lead.save();

    return lead;
  }

  async getByStatus(status: string, page = 1, limit = 20) {
    return this.getAll({ status }, page, limit);
  }

  async getByAssignee(userId: string, page = 1, limit = 20) {
    return this.getAll({ assignedTo: userId }, page, limit);
  }

  async search(query: string, page = 1, limit = 20) {
    const rx = new RegExp(escapeRegex(query), 'i');
    const filter = {
      $or: [
        { contactName: { $regex: rx } },
        { email: { $regex: rx } },
        { company: { $regex: rx } },
        { phone: { $regex: rx } },
        { leadId: { $regex: rx } },
      ],
    };
    return this.getAll(filter, page, limit);
  }
}

export const leadService = new LeadService();
