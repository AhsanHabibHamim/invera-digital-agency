import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: {
      type: String,
      enum: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'other'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

leaveSchema.index({ userId: 1, startDate: -1 });
leaveSchema.index({ status: 1 });

export default mongoose.model<ILeave>('Leave', leaveSchema);
