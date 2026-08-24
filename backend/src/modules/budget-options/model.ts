import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetOption extends Document {
  label: string;
  value: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const budgetOptionSchema = new Schema<IBudgetOption>(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

budgetOptionSchema.index({ order: 1 });
budgetOptionSchema.index({ isActive: 1 });

export default mongoose.model<IBudgetOption>('BudgetOption', budgetOptionSchema);
