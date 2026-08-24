import mongoose, { Schema, Document } from 'mongoose';

export interface ICaseStudy extends Document {
  title: string;
  slug: string;
  category: string;
  coverImage?: string;
  problem: string;
  solution: string;
  result: string;
  gradient?: string;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const caseStudySchema = new Schema<ICaseStudy>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, required: true },
    coverImage: { type: String },
    problem: { type: String, required: true },
    solution: { type: String, required: true },
    result: { type: String, required: true },
    gradient: { type: String, default: 'from-craft-violet to-craft-cyan' },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ICaseStudy>('CaseStudy', caseStudySchema);
