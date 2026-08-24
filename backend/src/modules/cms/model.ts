import mongoose, { Schema, Document } from 'mongoose';

export interface ISeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface ICmsContent extends Document {
  pageKey: string;
  sectionKey: string;
  contentType: 'text' | 'html' | 'json' | 'image';
  content: string;
  seoMeta?: ISeoMeta;
  updatedAt: Date;
}

const cmsSchema = new Schema<ICmsContent>(
  {
    pageKey: { type: String, required: true, index: true },
    sectionKey: { type: String, required: true },
    contentType: {
      type: String,
      enum: ['text', 'html', 'json', 'image'],
      default: 'text',
    },
    content: { type: Schema.Types.Mixed, required: true },
    seoMeta: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      ogImage: { type: String },
    },
  },
  { timestamps: true }
);

cmsSchema.index({ pageKey: 1, sectionKey: 1 }, { unique: true });

export default mongoose.model<ICmsContent>('CmsContent', cmsSchema);
