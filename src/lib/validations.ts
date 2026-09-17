import { z } from 'zod';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  INTERVIEW_OUTCOMES,
  ROLE_TYPES,
  ROUND_TYPES,
  WORK_MODES,
} from './enums';

export const applicationSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255),
  job_title: z.string().min(1, 'Job title is required').max(255),
  role_type: z.enum(ROLE_TYPES, { errorMap: () => ({ message: 'Invalid role type' }) }),
  work_mode: z.enum(WORK_MODES, { errorMap: () => ({ message: 'Invalid work mode' }) }),
  location_details: z.string().max(255).optional().nullable(),
  job_posting_url: z.string().max(500).optional().nullable(),
  notes: z.string().optional().nullable(),
  salary_range: z.string().max(100).optional().nullable(),
  application_date: z.string().min(1, 'Application date is required'),
  application_source: z.enum(APPLICATION_SOURCES, { errorMap: () => ({ message: 'Invalid source' }) }),
  referral_contact: z.string().max(255).optional().nullable(),
  status: z.enum(APPLICATION_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }),
  follow_up_date: z.string().optional().nullable(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const interviewSchema = z.object({
  application_id: z.coerce.number({ invalid_type_error: 'Application is required' }).int().positive('Please select a valid application'),
  round_type: z.enum(ROUND_TYPES, { errorMap: () => ({ message: 'Invalid round type' }) }),
  interview_datetime: z.string().min(1, 'Interview date & time is required'),
  interviewers: z.string().max(500).optional().nullable(),
  meeting_link: z.string().max(500).optional().nullable(),
  prep_notes: z.string().optional().nullable(),
  feedback: z.string().optional().nullable(),
  outcome: z.enum(INTERVIEW_OUTCOMES, { errorMap: () => ({ message: 'Invalid outcome' }) }),
  thank_you_sent: z.boolean().default(false),
});

export type InterviewInput = z.infer<typeof interviewSchema>;

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

