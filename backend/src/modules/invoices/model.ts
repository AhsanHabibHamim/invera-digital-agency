import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceLineItem {
  description: string;
  qty: number;
  price: number;
}

export interface IInvoice extends Document {
  clientId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  quoteId?: mongoose.Types.ObjectId;
  invoiceNumber: string;
  lineItems: IInvoiceLineItem[];
  total: number;
  discountCode?: string;
  discountAmount: number;
  tax: number;
  currency: 'USD' | 'BDT';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: Date;
   paidAt?: Date;
   paymentMethod?: 'bank_transfer' | 'bkash' | 'nagad' | 'other';
   transactionRef?: string;
   confirmedByName?: string;
   confirmedAt?: Date;
   notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceLineItemSchema = new Schema<IInvoiceLineItem>({
  description: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const invoiceSchema = new Schema<IInvoice>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    quoteId: { type: Schema.Types.ObjectId, ref: 'Quote' },
    invoiceNumber: { type: String, required: true, unique: true },
    lineItems: [invoiceLineItemSchema],
    total: { type: Number, required: true },
    discountCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    currency: { type: String, enum: ['USD', 'BDT'], default: 'USD' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    dueDate: { type: Date },
    paidAt: { type: Date },
    paymentMethod: { type: String, enum: ['bank_transfer', 'bkash', 'nagad', 'other'] },
    transactionRef: { type: String },
    confirmedByName: { type: String },
    confirmedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

invoiceSchema.index({ status: 1 });
invoiceSchema.index({ clientId: 1 });

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
