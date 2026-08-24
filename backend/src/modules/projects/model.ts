import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestone {
  title: string;
  dueDate?: Date;
  done: boolean;
  revisionRequested: boolean;
  revisionNotes?: string;
}

export interface IProject extends Document {
  clientId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  serviceId?: mongoose.Types.ObjectId;
  assignedTeam: mongoose.Types.ObjectId[];
  status: 'requested' | 'quoted' | 'in_progress' | 'in_review' | 'completed' | 'closed';
  milestones: IMilestone[];
  progressPercent: number;
  contractAccepted: boolean;
  contractAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>({
  title: { type: String, required: true },
  dueDate: { type: Date },
  done: { type: Boolean, default: false },
  revisionRequested: { type: Boolean, default: false },
  revisionNotes: { type: String },
});

const projectSchema = new Schema<IProject>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 4000 },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    assignedTeam: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['requested', 'quoted', 'in_progress', 'in_review', 'completed', 'closed'],
      default: 'requested',
    },
    milestones: [milestoneSchema],
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    contractAccepted: { type: Boolean, default: false },
    contractAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
