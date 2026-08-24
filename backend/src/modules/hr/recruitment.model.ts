import mongoose, { Schema, Document } from 'mongoose';

export interface IJobApplication extends Document {
  position: string;
  department: string;
  candidateName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  experience?: string;
  skills: string[];
  expectedSalary?: string;
  source?: string;
  status: 'new' | 'screening' | 'shortlisted' | 'interview_scheduled' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  interviewDate?: Date;
  interviewer?: mongoose.Types.ObjectId;
  feedback?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const jobApplicationSchema = new Schema<IJobApplication>(
  {
    position: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    candidateName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    resumeUrl: { type: String },
    portfolioUrl: { type: String },
    coverLetter: { type: String },
    experience: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    expectedSalary: { type: String, trim: true },
    source: { type: String, trim: true },
    status: {
      type: String,
      enum: ['new', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'],
      default: 'new',
    },
    interviewDate: { type: Date },
    interviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    feedback: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ email: 1 });
jobApplicationSchema.index({ position: 1 });

export default mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);
