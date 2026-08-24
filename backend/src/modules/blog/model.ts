import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  coverImage?: string;
  excerpt?: string;
  body: string;
  tags: string[];
  published: boolean;
  publishedAt?: Date;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    coverImage: { type: String },
    excerpt: { type: String },
    body: { type: String, required: true },
    tags: [{ type: String, lowercase: true }],
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    author: { type: String, default: 'Invera Digital Agency' },
  },
  { timestamps: true }
);

export default mongoose.model<IBlogPost>('BlogPost', blogPostSchema);
