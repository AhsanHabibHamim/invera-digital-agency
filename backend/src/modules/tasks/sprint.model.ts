import mongoose, { Schema, Document } from 'mongoose';

export interface ISprint extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const sprintSchema = new Schema<ISprint>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    goal: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'cancelled'],
      default: 'planning',
    },
  },
  { timestamps: true }
);

sprintSchema.index({ projectId: 1, status: 1 });

export default mongoose.model<ISprint>('Sprint', sprintSchema);
