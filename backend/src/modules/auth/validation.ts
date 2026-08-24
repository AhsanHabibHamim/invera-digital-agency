import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(['client', 'developer']).optional(),
  ref: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

const profileFields = {
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(30).optional(),
  company: z.string().max(120).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  nickname: z.string().max(60).optional(),
  designation: z.string().max(80).optional(),
  bio: z.string().max(2000).optional(),
  country: z.string().max(80).optional(),
  timezone: z.string().max(60).optional(),
  skills: z.array(z.string().max(40)).max(30).optional(),
  github: z.string().max(200).optional(),
  linkedin: z.string().max(200).optional(),
  portfolio: z.string().max(300).optional(),
  availability: z.string().max(60).optional(),
  languages: z.array(z.string().max(40)).max(15).optional(),
};

export const updateProfileSchema = z.object(profileFields);

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const sendVerificationSchema = z.object({
  email: z.string().email(),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8).max(100),
});
