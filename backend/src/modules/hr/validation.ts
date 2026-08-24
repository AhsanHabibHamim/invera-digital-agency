import { z } from 'zod';

export const createLeaveSchema = z.object({
  userId: z.string().optional(),
  leaveType: z.enum(['annual', 'sick', 'personal', 'maternity', 'paternity', 'other']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(2),
});

export const approveLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

export const createApplicationSchema = z.object({
  position: z.string().min(2).max(200),
  department: z.string().min(2),
  candidateName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  expectedSalary: z.string().optional(),
  source: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(['new', 'screening', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected']).optional(),
  interviewDate: z.string().optional(),
  interviewer: z.string().optional(),
  feedback: z.string().optional(),
  notes: z.string().optional(),
});
