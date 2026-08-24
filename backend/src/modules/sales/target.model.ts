import mongoose, { Schema, Document } from 'mongoose';

export interface ISalesTarget extends Document {
  userId: mongoose.Types.ObjectId;
  targetAmount: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  achievedAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const salesTargetSchema = new Schema<ISalesTarget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'BDT', 'EUR', 'GBP'], default: 'USD' },
    period: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    achievedAmount: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

salesTargetSchema.index({ userId: 1, period: 1 });

export default mongoose.model<ISalesTarget>('SalesTarget', salesTargetSchema);
