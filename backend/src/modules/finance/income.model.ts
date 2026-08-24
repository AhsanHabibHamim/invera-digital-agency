import mongoose, { Schema, Document } from 'mongoose';

export interface IIncome extends Document {
  title: string;
  description?: string;
  amount: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  category: string;
  source: string;
  clientId?: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  incomeDate: Date;
  isRecurring: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const incomeSchema = new Schema<IIncome>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'BDT', 'EUR', 'GBP'], default: 'USD' },
    category: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User' },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    incomeDate: { type: Date, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ['weekly', 'monthly', 'yearly'] },
    notes: { type: String },
  },
  { timestamps: true }
);

incomeSchema.index({ category: 1 });
incomeSchema.index({ incomeDate: -1 });
incomeSchema.index({ clientId: 1 });
incomeSchema.index({ invoiceId: 1 });

export default mongoose.model<IIncome>('Income', incomeSchema);
