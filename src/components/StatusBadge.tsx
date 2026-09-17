import React from 'react';
import { ApplicationStatus } from '@/lib/enums';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  className?: string;
}

const STATUS_WISE_TOKENS: Record<string, { bg: string; text: string }> = {
  Bookmarked: { bg: '#e2f6d5', text: '#163300' },
  Applied: { bg: '#dbeafe', text: '#1e40af' },
  Screening: { bg: '#fef3c7', text: '#92400e' },
  Interviewing: { bg: '#ffedd5', text: '#9a3412' },
  'Offer Received': { bg: '#dcfce7', text: '#166534' },
  Rejected: { bg: '#fee2e2', text: '#991b1b' },
  Withdrawn: { bg: '#f3f4f6', text: '#4b5563' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const token = STATUS_WISE_TOKENS[status] || { bg: '#e2f6d5', text: '#163300' };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full font-inter text-xs font-semibold tracking-tight ${className}`}
      style={{ backgroundColor: token.bg, color: token.text }}
    >
      {status}
    </span>
  );
};
