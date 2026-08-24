import mongoose, { Schema, Document } from 'mongoose';

export interface IBankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingOrSwift?: string;
  branch?: string;
  instructions?: string;
}

export interface IMilestoneTemplateItem {
  title: string;
  offsetDays: number;
  amount?: number;
  tasks: string[];
}

export interface IProjectTemplate {
  serviceKey: string;
  label: string;
  durationDays: number;
  milestones: IMilestoneTemplateItem[];
}

export interface ISettings extends Document {
  key: string;
  value: Record<string, unknown>;
  updatedAt: Date;
}

const bankAccountSchema = new Schema<IBankAccount>({
  bankName: { type: String, default: '' },
  accountName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  routingOrSwift: { type: String, default: '' },
  branch: { type: String, default: '' },
  instructions: { type: String, default: '' },
}, { _id: false });

const milestoneTemplateSchema = new Schema<IMilestoneTemplateItem>({
  title: { type: String, required: true },
  offsetDays: { type: Number, default: 7 },
  amount: { type: Number, default: 0 },
  tasks: [{ type: String }],
}, { _id: false });

const projectTemplateSchema = new Schema<IProjectTemplate>({
  serviceKey: { type: String, required: true },
  label: { type: String, required: true },
  durationDays: { type: Number, default: 30 },
  milestones: [milestoneTemplateSchema],
}, { _id: false });

const settingsSchema = new Schema<ISettings>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export const SETTINGS_KEYS = {
  PAYMENTS: 'payments',
  AUTOMATION: 'automation',
} as const;

export default mongoose.model<ISettings>('Setting', settingsSchema);
export { bankAccountSchema, projectTemplateSchema };
