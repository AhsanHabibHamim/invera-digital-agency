import { api } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/auth.types';

export function register(data: { name: string; email: string; password: string; ref?: string }) {
  return api.post<AuthResponse>('/auth/register', data);
}

export function login(data: { email: string; password: string }) {
  return api.post<AuthResponse>('/auth/login', data);
}

/** Silent refresh — the refresh token travels via HttpOnly cookie. */
export function refreshToken() {
  return api.postWithCredentials<AuthResponse>('/auth/refresh-token');
}

export function logout() {
  return api.postWithCredentials<{ user: User }>('/auth/logout');
}

export function forgotPassword(data: { email: string }) {
  return api.post<null>('/auth/forgot-password', data);
}

export function resetPassword(data: { email: string; otp: string; password: string }) {
  return api.post<null>('/auth/reset-password', data);
}

export function sendVerificationEmail(data: { email: string }) {
  return api.post<null>('/auth/send-verification', data);
}

export function verifyEmail(data: { email: string; otp: string }) {
  return api.post<AuthResponse>('/auth/verify-email', data);
}

export function me() {
  return api.get<User>('/auth/me');
}

export function changePassword(data: { currentPassword: string; newPassword: string }) {
  return api.patch<null>('/auth/password', data);
}

export function updateProfile(data: Partial<Pick<User, 'name' | 'phone' | 'avatarUrl' | 'bio' | 'company'>>) {
  return api.patch<User>('/auth/profile', data);
}
