import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
  userId: mongoose.Types.ObjectId;
  dealId?: mongoose.Types.ObjectId;
  dealName: string;
  dealValue: number;
  commissionRate: number;
  commissionAmount: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  status: 'pending' | 'approved' | 'paid';
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dealId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    dealName: { type: String, required: true, trim: true },
    dealValue: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'BDT', 'EUR', 'GBP'], default: 'USD' },
    status: { type: String, enum: ['pending', 'approved', 'paid'], default: 'pending' },
    paidAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

commissionSchema.index({ userId: 1, status: 1 });

export default mongoose.model<ICommission>('Commission', commissionSchema);
