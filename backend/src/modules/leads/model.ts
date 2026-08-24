import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadCommunication {
  type: 'call' | 'email' | 'meeting' | 'note';
  content: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ILeadFile {
  fileName: string;
  fileUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ILeadReply {
  message: string;
  repliedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ILead extends Document {
  leadId: string;
  contactName: string;
  company?: string;
  country?: string;
  state?: string;
  city?: string;
  industry?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  message?: string;
  serviceInterest?: string;
  source?: string;
  referredBy?: string;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDealValue?: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  expectedCloseDate?: Date;
  lastContactDate?: Date;
  nextFollowUp?: Date;
  meetingSchedule?: Date;
  tags: string[];
  notes?: string;
  requirements?: string;
  interestedServices: string[];
  files: ILeadFile[];
  replies: ILeadReply[];
  communicationHistory: ILeadCommunication[];
  leadScore?: number;
  probability?: number;
  competitors?: string;
  decisionMaker?: boolean;
  currentWebsite?: string;
  websiteQuality?: 'poor' | 'average' | 'good' | 'excellent';
  seoScore?: number;
  socialPresenceScore?: number;
  potentialRevenue?: number;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const communicationSchema = new Schema<ILeadCommunication>({
  type: { type: String, enum: ['call', 'email', 'meeting', 'note'], required: true },
  content: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const leadFileSchema = new Schema<ILeadFile>({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const replySchema = new Schema<ILeadReply>({
  message: { type: String, required: true },
  repliedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const leadSchema = new Schema<ILead>(
  {
    leadId: { type: String, unique: true },
    contactName: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    industry: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    website: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    youtube: { type: String, trim: true },
    message: { type: String },
    serviceInterest: { type: String, trim: true },
    source: { type: String, trim: true },
    referredBy: { type: String, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    estimatedDealValue: { type: Number },
    currency: { type: String, enum: ['USD', 'BDT', 'EUR', 'GBP'], default: 'USD' },
    expectedCloseDate: { type: Date },
    lastContactDate: { type: Date },
    nextFollowUp: { type: Date },
    meetingSchedule: { type: Date },
    tags: [{ type: String, trim: true }],
    notes: { type: String },
    requirements: { type: String },
    interestedServices: [{ type: String, trim: true }],
    files: [leadFileSchema],
    replies: [replySchema],
    communicationHistory: [communicationSchema],
    leadScore: { type: Number, min: 0, max: 100 },
    probability: { type: Number, min: 0, max: 100 },
    competitors: { type: String },
    decisionMaker: { type: Boolean },
    currentWebsite: { type: String },
    websiteQuality: { type: String, enum: ['poor', 'average', 'good', 'excellent'] },
    seoScore: { type: Number, min: 0, max: 100 },
    socialPresenceScore: { type: Number, min: 0, max: 100 },
    potentialRevenue: { type: Number },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdBy: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ tags: 1 });
leadSchema.index({ source: 1 });

leadSchema.pre('save', async function (next) {
  if (!this.leadId) {
    const count = await mongoose.model('Lead').countDocuments();
    this.leadId = `LEAD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<ILead>('Lead', leadSchema);
