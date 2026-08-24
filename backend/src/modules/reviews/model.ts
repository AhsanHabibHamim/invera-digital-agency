import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  clientId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>('Review', reviewSchema);
