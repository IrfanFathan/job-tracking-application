'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { INTERVIEW_OUTCOMES, ROUND_TYPES, InterviewOutcome } from '@/lib/enums';
import { OUTCOME_TOKENS } from '@/lib/tokens';
import { toInputDateTimeFormat } from '@/lib/utils';
import { interviewSchema } from '@/lib/validations';
import { ApplicationOption, SearchableAppSelect } from './SearchableAppSelect';

export interface InterviewData {
  id?: number;
  int_code?: string;
  application_id: number;
  round_type: string;
  interview_datetime: string;
  interviewers?: string | null;
  meeting_link?: string | null;
  prep_notes?: string | null;
  feedback?: string | null;
  outcome: string;
  thank_you_sent: boolean;
}

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InterviewData) => Promise<void>;
  applications: ApplicationOption[];
  initialData?: InterviewData | null;
  defaultAppId?: number | null;
}

export const InterviewModal: React.FC<InterviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  applications,
  initialData,
  defaultAppId,
}) => {
  const [formData, setFormData] = useState<InterviewData>({
    application_id: defaultAppId || (applications[0]?.id ?? 0),
    round_type: 'Technical / Coding',
    interview_datetime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    interviewers: '',
    meeting_link: '',
    prep_notes: '',
    feedback: '',
    outcome: 'Pending Feedback',
    thank_you_sent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        interview_datetime: toInputDateTimeFormat(initialData.interview_datetime),
        interviewers: initialData.interviewers || '',
        meeting_link: initialData.meeting_link || '',
        prep_notes: initialData.prep_notes || '',
        feedback: initialData.feedback || '',
      });
    } else {
      setFormData({
        application_id: defaultAppId || (applications[0]?.id ?? 0),
        round_type: 'Technical / Coding',
        interview_datetime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        interviewers: '',
        meeting_link: '',
        prep_notes: '',
        feedback: '',
        outcome: 'Pending Feedback',
        thank_you_sent: false,
      });
    }
    setErrors({});
    setServerError(null);
  }, [initialData, defaultAppId, isOpen, applications]);

  if (!isOpen) return null;

  const handleChange = (field: keyof InterviewData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = interviewSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentOutcomeToken = OUTCOME_TOKENS[formData.outcome as InterviewOutcome] || OUTCOME_TOKENS['Pending Feedback'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e0f0c]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#d8dcd5] shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8ebe6] bg-white">
          <div className="flex items-center space-x-3">
            <h3 className="font-wise-display text-lg font-black text-[#0e0f0c] tracking-tight">
              {initialData ? `Edit Interview (${initialData.int_code})` : 'Schedule Interview'}
            </h3>
            <span
              className="px-2.5 py-1 rounded-full font-mono text-[11px] font-bold border border-black/10"
              style={{ backgroundColor: currentOutcomeToken.bg, color: currentOutcomeToken.text }}
            >
              {formData.outcome}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#454745] hover:text-[#0e0f0c] hover:bg-[#e8ebe6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {serverError && (
            <div className="p-3.5 rounded-2xl bg-[#320707]/10 border border-[#d03238]/30 text-[#d03238] text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Typeahead Searchable App Select */}
          <SearchableAppSelect
            applications={applications}
            value={formData.application_id}
            onChange={(appId) => handleChange('application_id', appId)}
            error={errors.application_id}
          />

          {/* Row 2: Round Type & Outcome */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#454745] uppercase tracking-wider mb-1.5">
                Round Type <span className="text-[#d03238]">*</span>
              </label>
              <select
                value={formData.round_type}
                onChange={(e) => handleChange('round_type', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6f3] border border-[#d8dcd5] text-xs font-semibold text-[#0e0f0c] focus:outline-none focus:border-[#9fe870]"
              >
                {ROUND_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#454745] uppercase tracking-wider mb-1.5">
                Outcome <span className="text-[#d03238]">*</span>
              </label>
              <select
                value={formData.outcome}
                onChange={(e) => handleChange('outcome', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6f3] border border-[#d8dcd5] text-xs font-semibold text-[#0e0f0c] focus:outline-none focus:border-[#9fe870]"
              >
                {INTERVIEW_OUTCOMES.map((oc) => (
                  <option key={oc} value={oc}>
                    {oc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Date & Time, Interviewers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#454745] uppercase tracking-wider mb-1.5">
                Interview Date & Time <span className="text-[#d03238]">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.interview_datetime}
                onChange={(e) => handleChange('interview_datetime', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6f3] border text-xs font-mono text-[#0e0f0c] focus:outline-none focus:border-[#9fe870] ${
                  errors.interview_datetime ? 'border-[#d03238]' : 'border-[#d8dcd5]'
                }`}
              />
              {errors.interview_datetime && <p className="mt-1 text-xs text-[#d03238] font-medium">{errors.interview_datetime}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#454745] uppercase tracking-wider mb-1.5">
                Interviewer(s) & Titles
              </label>
              <input
                type="text"
                value={formData.interviewers || ''}
                onChange={(e) => handleChange('interviewers', e.target.value)}
                placeholder="e.g. Arjun Nair - Eng Manager"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6f3] border border-[#d8dcd5] text-xs font-medium text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#9fe870]"
              />
            </div>
          </div>

          {/* Meeting Link & Thank You Checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#454745] uppercase tracking-wider mb-1.5">
                Meeting Link
              </label>
              <input
                type="url"
                value={formData.meeting_link || ''}
                onChange={(e) => handleChange('meeting_link', e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6f3] border border-[#d8dcd5] text-xs font-medium text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#9fe870]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#f4f6f3] border border-[#d8dcd5] flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="thank_you_sent"
                checked={formData.thank_you_sent}
                onChange={(e) => handleChange('thank_you_sent', e.target.checked)}
                className="w-4 h-4 rounded-md text-[#9fe870] focus:ring-[#9fe870] border-[#d8dcd5] accent-[#0e0f0c] cursor-pointer"
              />
              <label htmlFor="thank_you_sent" className="text-xs font-bold text-[#0e0f0c] cursor-pointer select-none">
                Thank-You Sent
              </label>
            </div>
          </div>

          {/* Prep Notes */}
          <div>
            <label className="block text-xs font-bold text-[#454745] uppercase tracking-wider mb-1.5">
              Prep Notes
            </label>
            <textarea
              rows={2}
              value={formData.prep_notes || ''}
              onChange={(e) => handleChange('prep_notes', e.target.value)}
              placeholder="System design topics, algorithm prep, questions to ask..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6f3] border border-[#d8dcd5] text-xs font-medium text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#9fe870]"
            />
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-xs font-bold text-[#454745] uppercase tracking-wider mb-1.5">
              Questions & Feedback Received
            </label>
            <textarea
              rows={2}
              value={formData.feedback || ''}
              onChange={(e) => handleChange('feedback', e.target.value)}
              placeholder="Questions asked by interviewer, feedback received..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f4f6f3] border border-[#d8dcd5] text-xs font-medium text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#9fe870]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e8ebe6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#454745] bg-[#e8ebe6] hover:bg-[#d8dcd5] hover:text-[#0e0f0c] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="wise-btn-primary inline-flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-bold disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0e0f0c]" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#0e0f0c]" />
                  <span>{initialData ? 'Update Interview' : 'Save Interview'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
