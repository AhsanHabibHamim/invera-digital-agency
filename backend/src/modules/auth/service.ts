import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../users/model';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { hashToken } from '../../utils/token';
import { sendVerificationOTPEmail, sendPasswordResetOTPEmail } from '../../services/email.service';

export class AuthService {
  generateVerificationOTP() {
    return {
      otp: crypto.randomInt(100000, 999999).toString(),
      expires: new Date(Date.now() + env.otpExpiresInMinutes * 60 * 1000),
    };
  }

  async register(data: { name: string; email: string; password: string; phone?: string; company?: string; role?: string; ref?: string }) {
    const existing = await User.findOne({ email: data.email });
    if (existing) throw new AppError('Email already registered', 400);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const role = data.role === 'developer' ? 'team' : 'client';

    // Resolve referral code (if provided)
    let referredBy: string | undefined;
    if (data.ref) {
      const referrer = await User.findOne({ referralCode: data.ref.toUpperCase() }).select('_id');
      if (referrer) referredBy = referrer._id.toString();
    }

    const smtpConfigured = !!(env.smtpHost || env.resendApiKey);
    const requireVerification = smtpConfigured;

    const referralCode = this.generateReferralCode(data.name);

    let user;
    let tokens: { accessToken: string; refreshToken: string } | undefined;
    if (requireVerification) {
      const { otp, expires } = this.generateVerificationOTP();
      user = await User.create({
        ...data,
        passwordHash,
        role,
        isEmailVerified: false,
        verificationOTP: otp,
        verificationOTPExpires: expires,
        verificationAttempts: 0,
        referralCode,
        referredBy,
      });
      await sendVerificationOTPEmail(user.email, user.name, otp);
    } else {
      user = await User.create({ ...data, passwordHash, role, referralCode, referredBy });
      tokens = this.generateTokens(user._id.toString());
      user.refreshToken = hashToken(tokens.refreshToken);
      await user.save();
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified !== false,
      },
      ...(tokens ?? {}),
    };
  }

  async sendVerificationEmail(email: string) {
    const user = await User.findOne({ email });
    if (!user) return;

    if (user.isEmailVerified) return;

    const { otp, expires } = this.generateVerificationOTP();
    user.verificationOTP = otp;
    user.verificationOTPExpires = expires;
    user.verificationAttempts = 0;
    await user.save();

    await sendVerificationOTPEmail(user.email, user.name, otp);
  }

  async verifyEmail(email: string, otp: string) {
    const user = await User.findOne({ email });
    if (!user || !user.verificationOTP || !user.verificationOTPExpires) {
      throw new AppError('Verification code is invalid or has expired. Please request a new one.', 400);
    }

    if (user.isEmailVerified) return;

    if (user.verificationAttempts! >= env.otpMaxAttempts) {
      throw new AppError('Too many incorrect attempts. Please request a new code.', 400);
    }

    if (user.verificationOTP !== otp || user.verificationOTPExpires < new Date()) {
      user.verificationAttempts = (user.verificationAttempts || 0) + 1;
      await user.save();
      throw new AppError('Invalid or expired OTP', 400);
    }

    user.isEmailVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    user.verificationAttempts = undefined;
    await user.save();

    const tokens = this.generateTokens(user._id.toString());
    user.refreshToken = hashToken(tokens.refreshToken);
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: true },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

    if (user.isEmailVerified === false) {
      throw new AppError('EMAIL_NOT_VERIFIED', 403);
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remaining = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${remaining} minute(s)`, 429);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.loginAttempts = 0;
        await user.save();
        throw new AppError('Account locked. Try again in 15 minutes', 429);
      }
      await user.save();
      throw new AppError('Invalid credentials', 401);
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    const tokens = this.generateTokens(user._id.toString());
    user.refreshToken = hashToken(tokens.refreshToken);
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl, company: user.company, isEmailVerified: user.isEmailVerified },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.jwtRefreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);
      if (!user || user.refreshToken !== hashToken(token)) throw new AppError('Invalid refresh token', 401);

      const tokens = this.generateTokens(user._id.toString());
      user.refreshToken = hashToken(tokens.refreshToken);
      await user.save();

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) return;

    const otp = crypto.randomInt(100000, 999999).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetOTPEmail(user.email, otp);
  }

  async resetPassword(email: string, otp: string, password: string) {
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      throw new AppError('Invalid reset request', 400);
    }

    if (user.resetPasswordOTP !== otp || user.resetPasswordOTPExpires < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    user.refreshToken = undefined;
    await user.save();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.refreshToken = undefined;
    await user.save();
  }

  async updateProfile(userId: string, data: any) {
    const allowedFields = ['name', 'phone', 'company', 'avatarUrl', 'nickname', 'designation', 'bio', 'country', 'timezone', 'skills', 'github', 'linkedin', 'portfolio', 'availability', 'languages'];
    const update: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) update[field] = data[field];
    }
    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-passwordHash -refreshToken -resetPasswordOTP -resetPasswordOTPExpires');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  private generateReferralCode(name: string): string {
    const base = name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'USER';
    return `${base}${crypto.randomInt(100, 999)}`;
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });
    const refreshToken = jwt.sign({ userId }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn as any });
    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
