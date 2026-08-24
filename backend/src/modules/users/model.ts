import mongoose, { Schema, Document } from 'mongoose';
import { IRole } from '../roles/model';

export type UserRole = 'super_admin' | 'admin' | 'team' | 'client';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  roles?: mongoose.Types.ObjectId[] | IRole[];
  phone?: string;
  company?: string;
  avatarUrl?: string;
  nickname?: string;
  designation?: string;
  department?: string;
  skills?: string[];
  experience?: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  bio?: string;
  country?: string;
  timezone?: string;
  availability?: string;
  employeeId?: string;
  languages?: string[];
  workingStatus?: string;
  joiningDate?: Date;
  twoFAEnabled: boolean;
  isActive: boolean;
  isEmailVerified: boolean;
  verificationOTP?: string;
  verificationOTPExpires?: Date;
  verificationAttempts?: number;
  refreshToken?: string;
  resetPasswordOTP?: string;
  resetPasswordOTPExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'admin', 'team', 'client'], default: 'client' },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    avatarUrl: { type: String },
    nickname: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    experience: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    bio: { type: String, trim: true },
    country: { type: String, trim: true },
    timezone: { type: String, trim: true },
    availability: { type: String, trim: true },
    employeeId: { type: String, trim: true },
    languages: [{ type: String, trim: true }],
    workingStatus: { type: String, trim: true },
    joiningDate: { type: Date },
    twoFAEnabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: true },
    verificationOTP: { type: String },
    verificationOTPExpires: { type: Date },
    verificationAttempts: { type: Number, default: 0 },
    refreshToken: { type: String },
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpires: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    referralCode: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export default mongoose.model<IUser>('User', userSchema);
