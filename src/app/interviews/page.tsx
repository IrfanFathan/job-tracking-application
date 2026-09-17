'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CalendarCheck2,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
  UserCheck,
  CheckSquare,
  Square,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { OutcomeBadge } from '@/components/OutcomeBadge';
import { InterviewModal, InterviewData } from '@/components/InterviewModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { ApplicationModal, ApplicationData } from '@/components/ApplicationModal';
import { INTERVIEW_OUTCOMES, ROUND_TYPES, InterviewOutcome } from '@/lib/enums';
import { OUTCOME_TOKENS } from '@/lib/tokens';
import { formatDateTime } from '@/lib/utils';

interface InterviewRow extends InterviewData {
  id: number;
  int_code: string;
  application: {
    id: number;
    app_code: string;
    company_name: string;
    job_title: string;
    status: string;
  };
}

function InterviewsContent() {
  const searchParams = useSearchParams();

  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [applicationsForSelect, setApplicationsForSelect] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL');
  const [selectedRoundType, setSelectedRoundType] = useState<string>('ALL');

  const [isIntModalOpen, setIsIntModalOpen] = useState(false);
  const [editingInt, setEditingInt] = useState<InterviewRow | null>(null);
  const [defaultAppId, setDefaultAppId] = useState<number | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingInt, setDeletingInt] = useState<InterviewRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  // Read query params on mount
  useEffect(() => {
    const appIdParam = searchParams.get('application_id');
    const filterParam = searchParams.get('filter');

    if (appIdParam) {
      const parsedId = parseInt(appIdParam, 10);
      if (!isNaN(parsedId)) {
        setDefaultAppId(parsedId);
      }
    }

    if (filterParam === 'upcoming') {
      setSelectedOutcome('ALL');
    }
  }, [searchParams]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/interviews');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to fetch interviews');
      }
      const data = await res.json();
      setInterviews(data);
    } catch (err: any) {
      setError(err.message || 'Error loading interviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplicationsForSelect(data);
      }
    } catch (err) {
      console.error('Failed to load applications for select', err);
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchApplications();
  }, []);

  const handleSaveInterview = async (data: InterviewData) => {
    const isEdit = !!editingInt?.id;
    const url = isEdit ? `/api/interviews/${editingInt.id}` : '/api/interviews';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save interview');
    }

    await fetchInterviews();
  };

  // Row Quick-Change Outcome Dropdown Handler
  const handleQuickOutcomeChange = async (intId: number, newOutcome: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();

    // Optimistic UI update
    setInterviews((prev) =>
      prev.map((item) => (item.id === intId ? { ...item, outcome: newOutcome } : item))
    );

    try {
      const res = await fetch(`/api/interviews/${intId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: newOutcome }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update outcome');
      }

      await fetchInterviews();
    } catch (err: any) {
      alert(err.message || 'Failed to update outcome. Rolling back.');
      await fetchInterviews();
    }
  };

  // One-Click Thank You Sent Toggle directly in row
  const handleToggleThankYou = async (interview: InterviewRow, e: React.MouseEvent) => {
    e.stopPropagation();

    const newSentState = !interview.thank_you_sent;

    // Optimistic update
    setInterviews((prev) =>
      prev.map((item) => (item.id === interview.id ? { ...item, thank_you_sent: newSentState } : item))
    );

    try {
      const res = await fetch(`/api/interviews/${interview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thank_you_sent: newSentState }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update thank you status');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle thank you note state.');
      await fetchInterviews();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingInt) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/interviews/${deletingInt.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete interview');
      }
      await fetchInterviews();
      setIsDeleteModalOpen(false);
      setDeletingInt(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting interview');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveApplication = async (data: ApplicationData) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create application');
    }
    await fetchApplications();
  };

  const filteredInterviews = interviews.filter((int) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      int.int_code.toLowerCase().includes(query) ||
      int.application.company_name.toLowerCase().includes(query) ||
      int.application.job_title.toLowerCase().includes(query) ||
      int.round_type.toLowerCase().includes(query) ||
      (int.interviewers && int.interviewers.toLowerCase().includes(query)) ||
      (int.prep_notes && int.prep_notes.toLowerCase().includes(query)) ||
      (int.feedback && int.feedback.toLowerCase().includes(query));

    const matchesOutcome = selectedOutcome === 'ALL' || int.outcome === selectedOutcome;
    const matchesRoundType = selectedRoundType === 'ALL' || int.round_type === selectedRoundType;

    return matchesSearch && matchesOutcome && matchesRoundType;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#e8ebe6] text-[#0e0f0c]">
      <Navigation
        onNewApplication={() => setIsAppModalOpen(true)}
        onNewInterview={() => {
          setEditingInt(null);
          setIsIntModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#d8dcd5] pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#454745]">
              <Terminal className="w-3.5 h-3.5 text-[#163300]" />
              <span>wise-tracker / interviews</span>
            </div>
            <h1 className="font-wise-display text-3xl font-black text-[#0e0f0c] tracking-tight mt-1 flex items-center gap-3">
              Interview Rounds Log
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-white text-[#0e0f0c] border border-[#d8dcd5] font-bold">
                {filteredInterviews.length} rounds
              </span>
            </h1>
            <p className="text-xs text-[#454745] mt-1.5 font-medium">
              Click any row to edit details. Quick-change outcomes or thank-you notes inline directly from table rows.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingInt(null);
              setIsIntModalOpen(true);
            }}
            className="wise-btn-primary inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-md self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-[#0e0f0c]" />
            <span>Schedule Interview</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#320707]/10 border border-[#d03238]/30 text-[#d03238] text-xs flex items-center gap-2.5 font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-5 rounded-3xl bg-white border border-[#d8dcd5] shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search company, title, INT code, interviewer..."
                className="w-full bg-[#f4f6f3] text-[#0e0f0c] text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-[#d8dcd5] focus:outline-none focus:border-[#9fe870] placeholder-[#868685]"
              />
            </div>

            {/* Outcome Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-[#868685] flex-shrink-0" />
              <select
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="w-full bg-[#f4f6f3] text-[#0e0f0c] text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#d8dcd5] focus:outline-none focus:border-[#9fe870]"
              >
                <option value="ALL">All Outcomes</option>
                {INTERVIEW_OUTCOMES.map((oc) => (
                  <option key={oc} value={oc}>
                    {oc}
                  </option>
                ))}
              </select>
            </div>

            {/* Round Type Filter */}
            <div>
              <select
                value={selectedRoundType}
                onChange={(e) => setSelectedRoundType(e.target.value)}
                className="w-full bg-[#f4f6f3] text-[#0e0f0c] text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#d8dcd5] focus:outline-none focus:border-[#9fe870]"
              >
                <option value="ALL">All Round Types</option>
                {ROUND_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-3xl border border-[#d8dcd5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f4f6f3] border-b border-[#d8dcd5] font-mono text-[11px] uppercase font-bold text-[#454745] tracking-wider">
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Linked App (JOIN)</th>
                  <th className="px-5 py-4">Round & Time</th>
                  <th className="px-5 py-4">Interviewers</th>
                  <th className="px-5 py-4">Quick-Change Outcome</th>
                  <th className="px-5 py-4">Thank-You Note</th>
                  <th className="px-5 py-4">Notes & Feedback</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ebe6] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#868685] font-medium">
                      Loading interview data…
                    </td>
                  </tr>
                ) : filteredInterviews.length > 0 ? (
                  filteredInterviews.map((int) => {
                    const outcomeToken = OUTCOME_TOKENS[int.outcome as InterviewOutcome] || OUTCOME_TOKENS['Pending Feedback'];

                    return (
                      <tr
                        key={int.id}
                        onClick={() => {
                          setEditingInt(int);
                          setIsIntModalOpen(true);
                        }}
                        className="hover:bg-[#f4f6f3] transition-colors cursor-pointer group"
                      >
                        {/* Code */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-[#0e0f0c] bg-[#e8ebe6] px-2.5 py-1 rounded-md border border-[#d8dcd5]">
                            {int.int_code}
                          </span>
                        </td>

                        {/* Linked App JOIN */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5 max-w-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[11px] font-bold text-[#0e0f0c] bg-[#e2f6d5] px-2 py-0.5 rounded-md border border-[#c5edab]">
                                {int.application.app_code}
                              </span>
                              <span className="font-bold text-sm text-[#0e0f0c] group-hover:text-[#163300] transition-colors">
                                {int.application.company_name}
                              </span>
                            </div>
                            <p className="text-xs text-[#454745] font-medium">{int.application.job_title}</p>
                          </div>
                        </td>

                        {/* Round & Time */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#0e0f0c] block">{int.round_type}</span>
                            <span className="font-mono text-[11px] text-[#0e0f0c] font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#868685]" />
                              {formatDateTime(int.interview_datetime)}
                            </span>
                          </div>
                        </td>

                        {/* Interviewers */}
                        <td className="px-5 py-4 max-w-xs">
                          {int.interviewers ? (
                            <div className="text-[#454745] font-medium flex items-start gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-[#868685] flex-shrink-0 mt-0.5" />
                              <span className="text-xs">{int.interviewers}</span>
                            </div>
                          ) : (
                            <span className="text-[#868685]">—</span>
                          )}
                          {int.meeting_link && (
                            <a
                              href={int.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center space-x-1 text-[11px] text-[#0e0f0c] font-bold hover:underline mt-1 font-mono"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#868685]" />
                              <span>Link</span>
                            </a>
                          )}
                        </td>

                        {/* Quick-Change Outcome Dropdown directly in row */}
                        <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <select
                              value={int.outcome}
                              onChange={(e) => handleQuickOutcomeChange(int.id, e.target.value, e)}
                              className="px-3 py-1 rounded-full font-mono text-[11px] font-bold tracking-tight border border-black/10 focus:outline-none cursor-pointer shadow-xs"
                              style={{ backgroundColor: outcomeToken.bg, color: outcomeToken.text }}
                            >
                              {INTERVIEW_OUTCOMES.map((oc) => (
                                <option key={oc} value={oc} style={{ backgroundColor: '#ffffff', color: '#0e0f0c' }}>
                                  {oc}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Thank-You Sent Interactive Toggle */}
                        <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleToggleThankYou(int, e)}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold transition-all shadow-xs ${
                              int.thank_you_sent
                                ? 'bg-[#e2f6d5] text-[#163300] border border-[#c5edab]'
                                : 'bg-[#e8ebe6] text-[#868685] hover:text-[#0e0f0c] border border-[#d8dcd5]'
                            }`}
                            title="Toggle Thank-You Note state"
                          >
                            {int.thank_you_sent ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5 text-[#2ead4b]" />
                                <span>Sent</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5 text-[#868685]" />
                                <span>Not Sent</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Notes & Feedback */}
                        <td className="px-5 py-4 max-w-xs">
                          <div className="space-y-0.5 text-[11px] text-[#454745] font-medium">
                            {int.prep_notes && (
                              <p className="line-clamp-2">
                                <span className="font-mono text-[#0e0f0c] font-bold">Prep:</span> {int.prep_notes}
                              </p>
                            )}
                            {int.feedback && (
                              <p className="line-clamp-2 text-[#b86700]">
                                <span className="font-mono text-[#0e0f0c] font-bold">FB:</span> {int.feedback}
                              </p>
                            )}
                            {!int.prep_notes && !int.feedback && <span className="text-[#868685]">—</span>}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingInt(int);
                                setIsIntModalOpen(true);
                              }}
                              className="p-1.5 rounded-full text-[#454745] hover:text-[#0e0f0c] hover:bg-[#e8ebe6] transition-all"
                              title="Edit Interview"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingInt(int);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-full text-[#868685] hover:text-[#d03238] hover:bg-[#320707]/10 transition-all"
                              title="Delete Interview"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="max-w-xs mx-auto space-y-2">
                        <CalendarCheck2 className="w-8 h-8 text-[#9fe870] mx-auto" />
                        <p className="text-xs font-bold text-[#454745]">No interview rounds match search criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      <InterviewModal
        isOpen={isIntModalOpen}
        onClose={() => {
          setIsIntModalOpen(false);
          setEditingInt(null);
        }}
        onSave={handleSaveInterview}
        applications={applicationsForSelect}
        initialData={editingInt}
        defaultAppId={defaultAppId}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingInt(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Interview"
        itemCode={deletingInt?.int_code || ''}
        companyName={deletingInt?.application.company_name}
        jobTitle={deletingInt?.round_type}
        description={`Are you sure you want to delete this ${deletingInt?.round_type} round for ${deletingInt?.application.company_name}?`}
        isDeleting={isDeleting}
      />

      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        onSave={handleSaveApplication}
      />
    </div>
  );
}

export default function InterviewsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[#868685]">Loading interviews page…</div>}>
      <InterviewsContent />
    </Suspense>
  );
}
