import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Live computed Days Since Applied matching spreadsheet DATEDIF logic.
 * Never stored in database.
 */
export function calculateDaysSinceApplied(
  applicationDate: string | Date | null | undefined,
  status: string
): string | number | null {
  if (!applicationDate) return null;
  
  if (['Rejected', 'Withdrawn', 'Offer Received'].includes(status)) {
    return 'Closed';
  }

  const appliedDate = new Date(applicationDate);
  if (isNaN(appliedDate.getTime())) return null;

  const today = new Date();
  // Set both to midnight UTC for accurate day difference
  const utcApplied = Date.UTC(appliedDate.getFullYear(), appliedDate.getMonth(), appliedDate.getDate());
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = utcToday - utcApplied;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function generateAppCode(sequenceNumber: number): string {
  return `APP-${String(sequenceNumber).padStart(3, '0')}`;
}

export function generateIntCode(sequenceNumber: number): string {
  return `INT-${String(sequenceNumber).padStart(3, '0')}`;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toInputDateFormat(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export function toInputDateTimeFormat(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}
