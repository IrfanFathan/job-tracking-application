import { ApplicationStatus, InterviewOutcome } from './enums';

export interface ColorToken {
  bg: string;
  text: string;
}

export const STATUS_TOKENS: Record<ApplicationStatus, ColorToken> = {
  Bookmarked: { bg: '#ECEFF1', text: '#546E7A' },
  Applied: { bg: '#E3F2FD', text: '#1565C0' },
  Screening: { bg: '#FFF8E1', text: '#F9A825' },
  Interviewing: { bg: '#FFE0B2', text: '#E65100' },
  'Offer Received': { bg: '#E8F5E9', text: '#2E7D32' },
  Rejected: { bg: '#FFEBEE', text: '#C62828' },
  Withdrawn: { bg: '#F5F5F5', text: '#9E9E9E' },
};

export const OUTCOME_TOKENS: Record<InterviewOutcome, ColorToken> = {
  Passed: { bg: '#E8F5E9', text: '#2E7D32' },
  'Pending Feedback': { bg: '#FFF8E1', text: '#F9A825' },
  'Needs Follow-Up': { bg: '#FFE0B2', text: '#E65100' },
  Rejected: { bg: '#FFEBEE', text: '#C62828' },
};
