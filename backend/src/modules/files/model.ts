import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  projectId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileUrl: string;
  fileName: string;
  version: number;
  type: string;
  contentHash?: string;
  createdAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    version: { type: Number, default: 1 },
    type: { type: String, required: true },
    contentHash: { type: String },
  },
  { timestamps: true }
);

fileSchema.index({ projectId: 1, contentHash: 1 });

export default mongoose.model<IFile>('File', fileSchema);
