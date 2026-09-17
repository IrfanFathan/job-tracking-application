export const ROLE_TYPES = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Internship',
] as const;

export type RoleType = (typeof ROLE_TYPES)[number];

export const WORK_MODES = [
  'Remote',
  'Hybrid',
  'On-site',
] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export const APPLICATION_SOURCES = [
  'LinkedIn',
  'Naukri',
  'Indeed',
  'Company Portal',
  'Referral',
  'Other',
] as const;

export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export const APPLICATION_STATUSES = [
  'Bookmarked',
  'Applied',
  'Screening',
  'Interviewing',
  'Offer Received',
  'Rejected',
  'Withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const ROUND_TYPES = [
  'HR Screen',
  'Recruiter Call',
  'Technical / Coding',
  'Take-Home Assignment',
  'System Design',
  'Behavioral / Culture Fit',
  'Final Round',
] as const;

export type RoundType = (typeof ROUND_TYPES)[number];

export const INTERVIEW_OUTCOMES = [
  'Passed',
  'Pending Feedback',
  'Needs Follow-Up',
  'Rejected',
] as const;

export type InterviewOutcome = (typeof INTERVIEW_OUTCOMES)[number];
