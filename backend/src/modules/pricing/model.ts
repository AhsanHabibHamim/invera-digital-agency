import mongoose, { Schema, Document } from 'mongoose';

export interface IPricingPlan extends Document {
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  currency: string;
  features: string[];
  badge?: string;
  cta: string;
  ctaText?: string;
  highlight: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const pricingPlanSchema = new Schema<IPricingPlan>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    monthly: { type: Number, required: true, min: 0 },
    yearly: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    features: [{ type: String, trim: true }],
    badge: { type: String, trim: true },
    cta: { type: String, default: 'Get started', trim: true },
    ctaText: { type: String, trim: true },
    highlight: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pricingPlanSchema.index({ order: 1 });
pricingPlanSchema.index({ isActive: 1 });

export default mongoose.model<IPricingPlan>('PricingPlan', pricingPlanSchema);
