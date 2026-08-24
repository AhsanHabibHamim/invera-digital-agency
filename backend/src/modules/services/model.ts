import mongoose, { Schema, Document } from 'mongoose';

export interface IPricingTier {
  name: string;
  price: number;
  features: string[];
}

export interface IService extends Document {
  title: string;
  slug: string;
  category: string;
  description: string;
  icon?: string;
  pricingTiers: IPricingTier[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pricingTierSchema = new Schema<IPricingTier>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  features: [{ type: String }],
});

const serviceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String },
    pricingTiers: [pricingTierSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });

export default mongoose.model<IService>('Service', serviceSchema);
