import React from 'react';
import { InterviewOutcome } from '@/lib/enums';

interface OutcomeBadgeProps {
  outcome: InterviewOutcome | string;
  className?: string;
}

const OUTCOME_WISE_TOKENS: Record<string, { bg: string; text: string }> = {
  Passed: { bg: '#dcfce7', text: '#166534' },
  'Pending Feedback': { bg: '#fef3c7', text: '#92400e' },
  'Needs Follow-Up': { bg: '#ffedd5', text: '#9a3412' },
  Rejected: { bg: '#fee2e2', text: '#991b1b' },
};

export const OutcomeBadge: React.FC<OutcomeBadgeProps> = ({ outcome, className = '' }) => {
  const token = OUTCOME_WISE_TOKENS[outcome] || { bg: '#fef3c7', text: '#92400e' };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full font-inter text-xs font-semibold tracking-tight ${className}`}
      style={{ backgroundColor: token.bg, color: token.text }}
    >
      {outcome}
    </span>
  );
};
