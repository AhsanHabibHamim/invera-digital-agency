import { Request, Response, NextFunction } from 'express';
import { authService } from './service';
import User from '../users/model';
import { AuthRequest } from '../../middleware/authGuard';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import {
  setRefreshCookie,
  clearRefreshCookie,
  extractRefreshToken,
} from '../../utils/cookies';

/** Strip the refresh token out of any payload before it hits the JSON body. */
function withoutRefreshToken<T extends Record<string, unknown>>(payload: T) {
  const { refreshToken, ...rest } = payload as any;
  return rest;
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      if ('refreshToken' in result && result.refreshToken) {
        setRefreshCookie(res, (result as any).refreshToken);
      }
      sendSuccess(res, withoutRefreshToken(result as any), 'Registration successful. Please verify your email to continue.', 201);
    } catch (error) {
      next(error);
    }
  }

  async sendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.sendVerificationEmail(req.body.email);
      sendSuccess(res, null, 'If the email exists, a verification code has been sent');
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyEmail(req.body.email, req.body.otp);
      if (!result || !('refreshToken' in result)) {
        sendSuccess(res, null, 'Email already verified. Please sign in.');
        return;
      }
      setRefreshCookie(res, (result as any).refreshToken);
      sendSuccess(res, withoutRefreshToken(result), 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      setRefreshCookie(res, result.refreshToken);
      sendSuccess(res, withoutRefreshToken(result), 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = extractRefreshToken(req);
      if (!token) throw new AppError('Refresh token missing', 401);
      const tokens = await authService.refreshToken(token);
      setRefreshCookie(res, tokens.refreshToken);
      sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
    } catch (error) {
      clearRefreshCookie(res);
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!._id);
      clearRefreshCookie(res);
      sendSuccess(res, null, 'Logged out');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, 'If the email exists, an OTP has been sent');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.email, req.body.otp, req.body.password);
      sendSuccess(res, null, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!._id).select('-passwordHash -refreshToken -resetPasswordOTP -resetPasswordOTPExpires -verificationOTP -verificationOTPExpires -verificationAttempts');
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }
      if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters', 400);
      }
      await authService.changePassword(req.user!._id, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.updateProfile(req.user!._id, req.body);
      sendSuccess(res, user, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
