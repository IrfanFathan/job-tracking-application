'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2, Plus, Trash2, Wand2, Sparkles, CheckCircle2, Info } from 'lucide-react';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  ROLE_TYPES,
  WORK_MODES,
} from '@/lib/enums';
import { toInputDateFormat } from '@/lib/utils';
import { applicationSchema } from '@/lib/validations';
import { StatusBadge } from './StatusBadge';

export interface ApplicationData {
  id?: number;
  app_code?: string;
  company_name: string;
  job_title: string;
  role_type: string;
  work_mode: string;
  location_details?: string | null;
  job_posting_url?: string | null;
  notes?: string | null;
  salary_range?: string | null;
  application_date: string;
  application_source: string;
  referral_contact?: string | null;
  status: string;
  follow_up_date?: string | null;
}

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ApplicationData, addAnother?: boolean) => Promise<void>;
  onDeleteRequest?: (app: ApplicationData) => void;
  initialData?: ApplicationData | null;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDeleteRequest,
  initialData,
}) => {
  const defaultState: ApplicationData = {
    company_name: '',
    job_title: '',
    role_type: 'Full-Time',
    work_mode: 'Remote',
    location_details: '',
    job_posting_url: '',
    notes: '',
    salary_range: '',
    application_date: new Date().toISOString().split('T')[0],
    application_source: 'LinkedIn',
    referral_contact: '',
    status: 'Bookmarked',
    follow_up_date: '',
  };

  const [formData, setFormData] = useState<ApplicationData>(defaultState);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Auto-fill state
  const [autofillInput, setAutofillInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseNotice, setParseNotice] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        application_date: toInputDateFormat(initialData.application_date) || new Date().toISOString().split('T')[0],
        follow_up_date: toInputDateFormat(initialData.follow_up_date),
        location_details: initialData.location_details || '',
        job_posting_url: initialData.job_posting_url || '',
        notes: initialData.notes || '',
        salary_range: initialData.salary_range || '',
        referral_contact: initialData.referral_contact || '',
      });
    } else {
      setFormData(defaultState);
    }
    setIsDirty(false);
    setErrors({});
    setServerError(null);
    setAutofillInput('');
    setParseNotice(null);
    setAutoFilledFields(new Set());
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ApplicationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    // Remove auto-filled highlight if manually modified
    if (autoFilledFields.has(field)) {
      setAutoFilledFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  const handleParseJobPosting = async () => {
    if (!autofillInput.trim()) return;

    try {
      setIsParsing(true);
      setParseNotice(null);

      const res = await fetch('/api/parse-job-posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: autofillInput }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to parse job posting');
      }

      const extracted = resData.data || {};
      const filledSet = new Set<string>(resData.auto_filled_fields || []);

      setFormData((prev) => ({
        ...prev,
        company_name: extracted.company_name || prev.company_name,
        job_title: extracted.job_title || prev.job_title,
        location_details: extracted.location_details || prev.location_details,
        work_mode: extracted.work_mode || prev.work_mode,
        salary_range: extracted.salary_range || prev.salary_range,
        notes: extracted.notes || prev.notes,
        application_source: extracted.application_source || prev.application_source,
        job_posting_url: extracted.job_posting_url || prev.job_posting_url,
        status: prev.status || 'Bookmarked',
      }));

      setAutoFilledFields(filledSet);
      setIsDirty(true);

      if (resData.warning) {
        setParseNotice({
          type: 'warning',
          message: resData.warning,
        });
      } else {
        setParseNotice({
          type: 'success',
          message: 'Job posting parsed! Fields marked with "Auto-filled" tag — please review before saving.',
        });
      }
    } catch (err: any) {
      setParseNotice({
        type: 'error',
        message: err.message || "Couldn't auto-detect the rest — go ahead and fill it in manually.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    onClose();
  };

  const executeSave = async (addAnother: boolean = false) => {
    setErrors({});
    setServerError(null);

    const result = applicationSchema.safeParse(formData);
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
      await onSave(formData, addAnother);
      if (addAnother) {
        setFormData({
          ...defaultState,
          application_date: new Date().toISOString().split('T')[0],
        });
        setIsDirty(false);
        setAutofillInput('');
        setParseNotice(null);
        setAutoFilledFields(new Set());
      } else {
        onClose();
      }
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.company_name.trim().length > 0 && formData.job_title.trim().length > 0;

  const renderAutoFilledBadge = (field: string) => {
    if (!autoFilledFields.has(field)) return null;
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 ml-2 rounded-full text-[10px] font-bold bg-[#e2f6d5] text-[#163300] border border-[#c5edab]">
        <Sparkles className="w-2.5 h-2.5 text-[#163300]" />
        <span>Auto-filled</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e0f0c]/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#ffffff] rounded-2xl border border-[#d0d6cc] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8ebe6] bg-[#f4f6f3]">
          <div className="flex items-center space-x-3">
            <h3 className="text-base font-bold text-[#0e0f0c] font-wise-display">
              {initialData ? `Edit Application (${initialData.app_code})` : 'New Job Application'}
            </h3>
            <StatusBadge status={formData.status} />
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-[#868685] hover:text-[#0e0f0c] hover:bg-[#e8ebe6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => { e.preventDefault(); executeSave(false); }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Phase 2: Share-to-Autofill Input Section (Shown for new apps or when editing) */}
          {!initialData && (
            <div className="p-4 rounded-2xl bg-[#f4f6f3] border border-[#d8dcd5] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#0e0f0c]">
                  <Wand2 className="w-4 h-4 text-[#163300]" />
                  <span>Auto-fill from Job Posting (LinkedIn, Naukri, Indeed)</span>
                </div>
                <span className="text-[11px] font-medium text-[#868685]">Paste URL and/or text</span>
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={autofillInput}
                  onChange={(e) => setAutofillInput(e.target.value)}
                  placeholder="Paste LinkedIn, Naukri, or Indeed URL and/or job description text here..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#d8dcd5] text-xs font-medium text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#9fe870]"
                />
                <button
                  type="button"
                  onClick={handleParseJobPosting}
                  disabled={isParsing || !autofillInput.trim()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#9fe870] transition-colors border border-[#d8dcd5] self-end disabled:opacity-40"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0e0f0c]" />
                      <span>Parsing…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#163300]" />
                      <span>Parse</span>
                    </>
                  )}
                </button>
              </div>

              {parseNotice && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                    parseNotice.type === 'success'
                      ? 'bg-[#e2f6d5] text-[#163300] border border-[#c5edab]'
                      : parseNotice.type === 'warning'
                      ? 'bg-[#ffd11a]/20 text-[#4a3b1c] border border-[#ffd11a]/40'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {parseNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#2ead4b]" />
                  ) : (
                    <Info className="w-4 h-4 flex-shrink-0 text-[#b86700]" />
                  )}
                  <span>{parseNotice.message}</span>
                </div>
              )}
            </div>
          )}

          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Row 1: Company & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Company Name <span className="text-rose-600">*</span>
                {renderAutoFilledBadge('company_name')}
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="e.g. Acme Robotics"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#0e0f0c] ${
                  autoFilledFields.has('company_name') ? 'bg-[#f4fbf0] border-[#c5edab]' : 'bg-[#ffffff] border-[#d0d6cc]'
                } ${errors.company_name ? 'border-rose-500' : ''}`}
              />
              {errors.company_name && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.company_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Job Title <span className="text-rose-600">*</span>
                {renderAutoFilledBadge('job_title')}
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                placeholder="e.g. Embedded Firmware Engineer"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#0e0f0c] ${
                  autoFilledFields.has('job_title') ? 'bg-[#f4fbf0] border-[#c5edab]' : 'bg-[#ffffff] border-[#d0d6cc]'
                } ${errors.job_title ? 'border-rose-500' : ''}`}
              />
              {errors.job_title && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.job_title}</p>}
            </div>
          </div>

          {/* Row 2: Status & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Status <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#d0d6cc] text-xs text-[#0e0f0c] focus:outline-none focus:border-[#0e0f0c]"
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Source <span className="text-rose-600">*</span>
                {renderAutoFilledBadge('application_source')}
              </label>
              <select
                value={formData.application_source}
                onChange={(e) => handleChange('application_source', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0e0f0c] focus:outline-none focus:border-[#0e0f0c] ${
                  autoFilledFields.has('application_source') ? 'bg-[#f4fbf0] border-[#c5edab]' : 'bg-[#ffffff] border-[#d0d6cc]'
                }`}
              >
                {APPLICATION_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Role Type & Work Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Role Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.role_type}
                onChange={(e) => handleChange('role_type', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#d0d6cc] text-xs text-[#0e0f0c] focus:outline-none focus:border-[#0e0f0c]"
              >
                {ROLE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Work Mode <span className="text-rose-600">*</span>
                {renderAutoFilledBadge('work_mode')}
              </label>
              <select
                value={formData.work_mode}
                onChange={(e) => handleChange('work_mode', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0e0f0c] focus:outline-none focus:border-[#0e0f0c] ${
                  autoFilledFields.has('work_mode') ? 'bg-[#f4fbf0] border-[#c5edab]' : 'bg-[#ffffff] border-[#d0d6cc]'
                }`}
              >
                {WORK_MODES.map((wm) => (
                  <option key={wm} value={wm}>
                    {wm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Application Date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={formData.application_date}
                onChange={(e) => handleChange('application_date', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border text-xs text-[#0e0f0c] font-mono-wise focus:outline-none focus:border-[#0e0f0c] ${
                  errors.application_date ? 'border-rose-500' : 'border-[#d0d6cc]'
                }`}
              />
              {errors.application_date && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.application_date}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={formData.follow_up_date || ''}
                onChange={(e) => handleChange('follow_up_date', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#d0d6cc] text-xs text-[#0e0f0c] font-mono-wise focus:outline-none focus:border-[#0e0f0c]"
              />
            </div>
          </div>

          {/* Row 5: Salary & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Salary Range
                {renderAutoFilledBadge('salary_range')}
              </label>
              <input
                type="text"
                value={formData.salary_range || ''}
                onChange={(e) => handleChange('salary_range', e.target.value)}
                placeholder="e.g. ₹18L - ₹22L / yr or $90k–$110k"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#0e0f0c] ${
                  autoFilledFields.has('salary_range') ? 'bg-[#f4fbf0] border-[#c5edab]' : 'bg-[#ffffff] border-[#d0d6cc]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Location Details
                {renderAutoFilledBadge('location_details')}
              </label>
              <input
                type="text"
                value={formData.location_details || ''}
                onChange={(e) => handleChange('location_details', e.target.value)}
                placeholder="e.g. Kochi, Kerala, India"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#0e0f0c] ${
                  autoFilledFields.has('location_details') ? 'bg-[#f4fbf0] border-[#c5edab]' : 'bg-[#ffffff] border-[#d0d6cc]'
                }`}
              />
            </div>
          </div>

          {/* Row 6: Referral & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Referral Contact
              </label>
              <input
                type="text"
                value={formData.referral_contact || ''}
                onChange={(e) => handleChange('referral_contact', e.target.value)}
                placeholder="e.g. Priya Menon"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#ffffff] border border-[#d0d6cc] text-xs text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#0e0f0c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
                Job Posting URL
                {renderAutoFilledBadge('job_posting_url')}
              </label>
              <input
                type="url"
                value={formData.job_posting_url || ''}
                onChange={(e) => handleChange('job_posting_url', e.target.value)}
                placeholder="https://..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#0e0f0c] ${
                  autoFilledFields.has('job_posting_url') ? 'bg-[#f4fbf0] border-[#c5edab]' : 'bg-[#ffffff] border-[#d0d6cc]'
                }`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#0e0f0c] mb-1">
              Notes / Job Description Highlights
              {renderAutoFilledBadge('notes')}
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Key requirements, tech stack, notes..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-[#0e0f0c] placeholder-[#868685] focus:outline-none focus:border-[#0e0f0c] ${
                autoFilledFields.has('notes') ? 'bg-[#f4fbf0] border-[#c5edab]' : 'bg-[#ffffff] border-[#d0d6cc]'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#e8ebe6]">
            <div>
              {initialData && onDeleteRequest && (
                <button
                  type="button"
                  onClick={() => onDeleteRequest(formData)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Application</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2.5 self-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#0e0f0c] bg-[#e8ebe6] hover:bg-[#dce1d9] transition-colors"
              >
                Cancel
              </button>

              {!initialData && (
                <button
                  type="button"
                  disabled={!isValid || isSubmitting}
                  onClick={() => executeSave(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#0e0f0c] bg-[#e8ebe6] hover:bg-[#dce1d9] transition-colors disabled:opacity-40"
                  title={!isValid ? 'Please fill in Company Name and Job Title' : 'Save and keep form open for rapid entry'}
                >
                  <Plus className="w-3.5 h-3.5 text-[#0e0f0c]" />
                  <span>Save & Add Another</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] transition-all transform hover:scale-[1.02] shadow-xs disabled:opacity-40"
                title={!isValid ? 'Please fill in Company Name and Job Title' : 'Save changes'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0e0f0c]" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-[#0e0f0c]" />
                    <span>{initialData ? 'Update Application' : 'Save Application'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

