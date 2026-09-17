'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
  MapPin,
  CalendarCheck2,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { ApplicationModal, ApplicationData } from '@/components/ApplicationModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { InterviewModal, InterviewData } from '@/components/InterviewModal';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  WORK_MODES,
  ApplicationStatus,
} from '@/lib/enums';
import { STATUS_TOKENS } from '@/lib/tokens';
import { formatDate } from '@/lib/utils';

interface ApplicationRow extends ApplicationData {
  id: number;
  app_code: string;
  days_since_applied: number | string | null;
  interview_count?: number;
  created_at?: string;
}

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationRow | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingApp, setDeletingApp] = useState<ApplicationRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isIntModalOpen, setIsIntModalOpen] = useState(false);
  const [selectedAppIdForInterview, setSelectedAppIdForInterview] = useState<number | null>(null);

  // Read URL params on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const filterParam = searchParams.get('filter');

    if (statusParam && APPLICATION_STATUSES.includes(statusParam as ApplicationStatus)) {
      setSelectedStatus(statusParam);
    } else if (filterParam === 'active') {
      // Set to all non-closed statuses or search
      setSelectedStatus('ALL');
    }
  }, [searchParams]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/applications');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to fetch applications');
      }
      const data = await res.json();
      setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSaveApplication = async (data: ApplicationData, addAnother: boolean = false) => {
    const isEdit = !!editingApp?.id;
    const url = isEdit ? `/api/applications/${editingApp.id}` : '/api/applications';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save application');
    }

    await fetchApplications();
  };

  // Row Quick-Change Status Dropdown Handler
  const handleQuickStatusChange = async (appId: number, newStatus: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();

    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );

    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update status');
      }

      await fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Failed to update status. Rolling back.');
      await fetchApplications(); // Rollback on error
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingApp) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/applications/${deletingApp.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete application');
      }
      await fetchApplications();
      setIsDeleteModalOpen(false);
      setDeletingApp(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting application');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveInterview = async (data: InterviewData) => {
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to schedule interview');
    }
    await fetchApplications();
  };

  const filteredApps = applications.filter((app) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      app.company_name.toLowerCase().includes(query) ||
      app.job_title.toLowerCase().includes(query) ||
      app.app_code.toLowerCase().includes(query) ||
      (app.location_details && app.location_details.toLowerCase().includes(query)) ||
      (app.referral_contact && app.referral_contact.toLowerCase().includes(query));

    const matchesStatus = selectedStatus === 'ALL' || app.status === selectedStatus;
    const matchesWorkMode = selectedWorkMode === 'ALL' || app.work_mode === selectedWorkMode;
    const matchesSource = selectedSource === 'ALL' || app.application_source === selectedSource;

    return matchesSearch && matchesStatus && matchesWorkMode && matchesSource;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#e8ebe6] text-[#0e0f0c]">
      <Navigation
        onNewApplication={() => {
          setEditingApp(null);
          setIsAppModalOpen(true);
        }}
        onNewInterview={() => {
          setSelectedAppIdForInterview(null);
          setIsIntModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#d8dcd5] pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#454745]">
              <Terminal className="w-3.5 h-3.5 text-[#163300]" />
              <span>wise-tracker / applications</span>
            </div>
            <h1 className="font-wise-display text-3xl font-black text-[#0e0f0c] tracking-tight mt-1 flex items-center gap-3">
              Applications Registry
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-white text-[#0e0f0c] border border-[#d8dcd5] font-bold">
                {filteredApps.length} records
              </span>
            </h1>
            <p className="text-xs text-[#454745] mt-1.5 font-medium">
              Click any row to view/edit details. Use row dropdowns for instant quick-change status updates.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingApp(null);
              setIsAppModalOpen(true);
            }}
            className="wise-btn-primary inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold shadow-md self-start md:self-auto"
          >
            <Plus className="w-4 h-4 text-[#0e0f0c]" />
            <span>New Application</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#868685] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search company, title, APP code..."
                className="w-full bg-[#f4f6f3] text-[#0e0f0c] text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-[#d8dcd5] focus:outline-none focus:border-[#9fe870] placeholder-[#868685]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-[#868685] flex-shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#f4f6f3] text-[#0e0f0c] text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#d8dcd5] focus:outline-none focus:border-[#9fe870]"
              >
                <option value="ALL">All Statuses</option>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Work Mode Filter */}
            <div>
              <select
                value={selectedWorkMode}
                onChange={(e) => setSelectedWorkMode(e.target.value)}
                className="w-full bg-[#f4f6f3] text-[#0e0f0c] text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#d8dcd5] focus:outline-none focus:border-[#9fe870]"
              >
                <option value="ALL">All Work Modes</option>
                {WORK_MODES.map((wm) => (
                  <option key={wm} value={wm}>
                    {wm}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full bg-[#f4f6f3] text-[#0e0f0c] text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#d8dcd5] focus:outline-none focus:border-[#9fe870]"
              >
                <option value="ALL">All Sources</option>
                {APPLICATION_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Registry Table */}
        <div className="bg-white rounded-3xl border border-[#d8dcd5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f4f6f3] border-b border-[#d8dcd5] font-mono text-[11px] uppercase font-bold text-[#454745] tracking-wider">
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Company & Role</th>
                  <th className="px-5 py-4">Quick-Change Status</th>
                  <th className="px-5 py-4">Days (Live)</th>
                  <th className="px-5 py-4">Applied</th>
                  <th className="px-5 py-4">Follow-up</th>
                  <th className="px-5 py-4">Salary & Location</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8ebe6] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#868685] font-medium">
                      Loading application data…
                    </td>
                  </tr>
                ) : filteredApps.length > 0 ? (
                  filteredApps.map((app) => {
                    const statusToken = STATUS_TOKENS[app.status as ApplicationStatus] || STATUS_TOKENS['Bookmarked'];

                    return (
                      <tr
                        key={app.id}
                        onClick={() => {
                          setEditingApp(app);
                          setIsAppModalOpen(true);
                        }}
                        className="hover:bg-[#f4f6f3] transition-colors cursor-pointer group"
                      >
                        {/* Code */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-[#0e0f0c] bg-[#e8ebe6] px-2.5 py-1 rounded-md border border-[#d8dcd5]">
                            {app.app_code}
                          </span>
                        </td>

                        {/* Company & Role */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5 max-w-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-[#0e0f0c] group-hover:text-[#163300] transition-colors">
                                {app.company_name}
                              </span>
                              {app.job_posting_url && (
                                <a
                                  href={app.job_posting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#868685] hover:text-[#0e0f0c] transition-colors"
                                  title="Open Job Posting"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-[#454745] font-medium">{app.job_title}</p>
                            <div className="flex items-center space-x-1.5 text-[11px] text-[#868685] pt-0.5 font-mono">
                              <span>{app.role_type}</span>
                              <span>•</span>
                              <span>{app.work_mode}</span>
                              <span>•</span>
                              <span>{app.application_source}</span>
                            </div>
                          </div>
                        </td>

                        {/* Quick-Change Status Dropdown directly in row */}
                        <td className="px-5 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <select
                              value={app.status}
                              onChange={(e) => handleQuickStatusChange(app.id, e.target.value, e)}
                              className="px-3 py-1 rounded-full font-mono text-[11px] font-bold tracking-tight border border-black/10 focus:outline-none cursor-pointer shadow-xs"
                              style={{ backgroundColor: statusToken.bg, color: statusToken.text }}
                            >
                              {APPLICATION_STATUSES.map((st) => (
                                <option key={st} value={st} style={{ backgroundColor: '#ffffff', color: '#0e0f0c' }}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Days Since Applied (Live Computed) */}
                        <td className="px-5 py-4 whitespace-nowrap font-mono">
                          {app.days_since_applied === 'Closed' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e8ebe6] text-[#868685] border border-[#d8dcd5]">
                              Closed
                            </span>
                          ) : typeof app.days_since_applied === 'number' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#e2f6d5] text-[#163300] border border-[#c5edab]">
                              <Clock className="w-3.5 h-3.5 text-[#163300]" />
                              <span>{app.days_since_applied}d ago</span>
                            </span>
                          ) : (
                            <span className="text-[#868685]">—</span>
                          )}
                        </td>

                        {/* Applied Date */}
                        <td className="px-5 py-4 whitespace-nowrap text-[#454745] font-mono font-medium">
                          {formatDate(app.application_date)}
                        </td>

                        {/* Follow-up Date */}
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-[#b86700] font-bold">
                          {app.follow_up_date ? formatDate(app.follow_up_date) : <span className="text-[#868685] font-normal">—</span>}
                        </td>

                        {/* Salary & Location */}
                        <td className="px-5 py-4 max-w-xs">
                          <div className="space-y-0.5 text-[11px]">
                            {app.salary_range && (
                              <p className="font-mono text-[#0e0f0c] font-bold">{app.salary_range}</p>
                            )}
                            {app.location_details && (
                              <p className="text-[#868685] font-medium flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-[#868685] flex-shrink-0" />
                                <span className="truncate">{app.location_details}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Actions — stopPropagation to prevent double row click */}
                        <td className="px-5 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppIdForInterview(app.id);
                                setIsIntModalOpen(true);
                              }}
                              className="p-1.5 rounded-full text-[#454745] hover:bg-[#9fe870] hover:text-[#0e0f0c] transition-all"
                              title="Schedule Interview for this application"
                            >
                              <CalendarCheck2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingApp(app);
                                setIsAppModalOpen(true);
                              }}
                              className="p-1.5 rounded-full text-[#454745] hover:text-[#0e0f0c] hover:bg-[#e8ebe6] transition-all"
                              title="Edit Application"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingApp(app);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-full text-[#868685] hover:text-[#d03238] hover:bg-[#320707]/10 transition-all"
                              title="Delete Application"
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
                        <Briefcase className="w-8 h-8 text-[#9fe870] mx-auto" />
                        <p className="text-xs font-bold text-[#454745]">No applications match search criteria.</p>
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
      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => {
          setIsAppModalOpen(false);
          setEditingApp(null);
        }}
        onSave={handleSaveApplication}
        onDeleteRequest={(appData) => {
          setIsAppModalOpen(false);
          const found = applications.find((a) => a.id === appData.id);
          if (found) {
            setDeletingApp(found);
            setIsDeleteModalOpen(true);
          }
        }}
        initialData={editingApp}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingApp(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        itemCode={deletingApp?.app_code || ''}
        companyName={deletingApp?.company_name}
        jobTitle={deletingApp?.job_title}
        linkedInterviewsCount={deletingApp?.interview_count || 0}
        description="This will permanently delete this application record and all of its linked interviews."
        isDeleting={isDeleting}
      />

      <InterviewModal
        isOpen={isIntModalOpen}
        onClose={() => {
          setIsIntModalOpen(false);
          setSelectedAppIdForInterview(null);
        }}
        onSave={handleSaveInterview}
        applications={applications.map((app) => ({
          id: app.id,
          app_code: app.app_code,
          company_name: app.company_name,
          job_title: app.job_title,
          status: app.status,
        }))}
        defaultAppId={selectedAppIdForInterview}
      />
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-[#868685]">Loading applications page…</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
