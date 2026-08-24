import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethod = 'bank_transfer' | 'bkash' | 'nagad' | 'other';
export type PaymentSubmissionStatus = 'pending' | 'confirmed' | 'rejected';

export interface IPaymentSubmission extends Document {
  invoiceId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  method: PaymentMethod;
  transactionRef: string;
  amount: number;
  screenshotUrl?: string;
  status: PaymentSubmissionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  reviewNote?: string;
  rejectionReason?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSubmissionSchema = new Schema<IPaymentSubmission>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    method: {
      type: String,
      enum: ['bank_transfer', 'bkash', 'nagad', 'other'],
      required: true,
    },
    transactionRef: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    screenshotUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedByName: { type: String },
    reviewNote: { type: String },
    rejectionReason: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSubmissionSchema.index({ invoiceId: 1, status: 1 });
paymentSubmissionSchema.index({ clientId: 1 });

export default mongoose.model<IPaymentSubmission>('PaymentSubmission', paymentSubmissionSchema);
