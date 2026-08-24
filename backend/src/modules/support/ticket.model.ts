import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketReply {
  message: string;
  createdBy: mongoose.Types.ObjectId;
  attachments: string[];
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketNumber: string;
  title: string;
  description: string;
  clientId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_on_client' | 'resolved' | 'closed';
  slaDeadline?: Date;
  slaBreached: boolean;
  replies: ITicketReply[];
  tags: string[];
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ticketReplySchema = new Schema<ITicketReply>({
  message: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_on_client', 'resolved', 'closed'],
      default: 'open',
    },
    slaDeadline: { type: Date },
    slaBreached: { type: Boolean, default: false },
    replies: [ticketReplySchema],
    tags: [{ type: String, trim: true }],
    closedAt: { type: Date },
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ clientId: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ category: 1 });

ticketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
  }
  if (this.status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }
  next();
});

export default mongoose.model<ITicket>('Ticket', ticketSchema);
