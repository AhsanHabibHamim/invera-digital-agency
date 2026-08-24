import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  clientId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  serviceCategory?: string;
  budgetRange?: string;
  desiredTimeline?: string;
  attachments: string[];
  status: 'submitted' | 'under_review' | 'quoted' | 'accepted' | 'declined';
  quoteId?: mongoose.Types.ObjectId;
  adminNotes?: string;
  clientResponseNotes?: string;
  declineReason?: string;
  // Click-to-accept e-signature audit trail
  acceptedAt?: Date;
  acceptedIp?: string;
  acceptedUserAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const proposalSchema = new Schema<IProposal>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    serviceCategory: { type: String, trim: true },
    budgetRange: { type: String, trim: true },
    desiredTimeline: { type: String, trim: true },
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'quoted', 'accepted', 'declined'],
      default: 'submitted',
    },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
    adminNotes: { type: String },
    clientResponseNotes: { type: String },
    declineReason: { type: String },
    acceptedAt: { type: Date },
    acceptedIp: { type: String },
    acceptedUserAgent: { type: String },
  },
  { timestamps: true }
);

proposalSchema.index({ clientId: 1, createdAt: -1 });
proposalSchema.index({ status: 1 });

export default mongoose.model<IProposal>('Proposal', proposalSchema);
