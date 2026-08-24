import mongoose, { Schema, Document } from 'mongoose';

export interface ILineItem {
  description: string;
  qty: number;
  price: number;
}

export interface IQuote extends Document {
  clientId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  quoteNumber: string;
  lineItems: ILineItem[];
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'converted';
  validUntil?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<ILineItem>({
  description: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const quoteSchema = new Schema<IQuote>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    quoteNumber: { type: String, required: true, unique: true },
    lineItems: [lineItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'expired', 'converted'],
      default: 'draft',
    },
    validUntil: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IQuote>('Quote', quoteSchema);
