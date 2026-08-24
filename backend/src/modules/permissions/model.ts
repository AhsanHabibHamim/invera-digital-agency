import mongoose, { Schema, Document } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  slug: string;
  group: string;
  module: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    group: { type: String, required: true, trim: true },
    module: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

permissionSchema.index({ group: 1 });
permissionSchema.index({ module: 1 });

export default mongoose.model<IPermission>('Permission', permissionSchema);
