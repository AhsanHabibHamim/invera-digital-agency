import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  description?: string;
  amount: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  category: string;
  paidBy: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  receiptUrl?: string;
  expenseDate: Date;
  isRecurring: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'yearly';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'BDT', 'EUR', 'GBP'], default: 'USD' },
    category: { type: String, required: true, trim: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    receiptUrl: { type: String },
    expenseDate: { type: Date, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ['weekly', 'monthly', 'yearly'] },
    notes: { type: String },
  },
  { timestamps: true }
);

expenseSchema.index({ category: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ projectId: 1 });

export default mongoose.model<IExpense>('Expense', expenseSchema);
