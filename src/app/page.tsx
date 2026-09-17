'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ExternalLink,
  ChevronRight,
  Terminal,
  AlertCircle,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { OutcomeBadge } from '@/components/OutcomeBadge';
import { ApplicationModal, ApplicationData } from '@/components/ApplicationModal';
import { InterviewModal, InterviewData } from '@/components/InterviewModal';
import { APPLICATION_STATUSES, ApplicationStatus } from '@/lib/enums';
import { STATUS_TOKENS } from '@/lib/tokens';
import { formatDate, formatDateTime } from '@/lib/utils';

interface SummaryData {
  kpis: {
    totalApplications: number;
    activePipeline: number;
    totalInterviews: number;
    offerRate: number;
    rejectionRate: number;
    offerCount: number;
    rejectedCount: number;
    eligibleApplicationsCount: number;
  };
  statusBreakdown: Record<string, number>;
  followUpsThisWeek: Array<{
    id: number;
    app_code: string;
    company_name: string;
    job_title: string;
    status: string;
    follow_up_date: string;
    days_since_applied: number | string | null;
  }>;
  upcomingInterviews: Array<{
    id: number;
    int_code: string;
    round_type: string;
    interview_datetime: string;
    outcome: string;
    interviewers?: string | null;
    meeting_link?: string | null;
    application: {
      id: number;
      app_code: string;
      company_name: string;
      job_title: string;
      status: string;
    };
  }>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isIntModalOpen, setIsIntModalOpen] = useState(false);
  const [applicationsForSelect, setApplicationsForSelect] = useState<any[]>([]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to load summary');
      }
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsList = async () => {
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
    fetchSummary();
    fetchApplicationsList();
  }, []);

  const handleCreateApplication = async (data: ApplicationData) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create application');
    }
    await fetchSummary();
    await fetchApplicationsList();
  };

  const handleCreateInterview = async (data: InterviewData) => {
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create interview');
    }
    await fetchSummary();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8ebe6] text-[#0e0f0c]">
      <Navigation
        onNewApplication={() => setIsAppModalOpen(true)}
        onNewInterview={() => setIsIntModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Wise Hero Band */}
        <section className="bg-white rounded-3xl p-8 sm:p-10 border border-[#d8dcd5] shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#e2f6d5] border border-[#c5edab] text-xs font-bold text-[#163300]">
                <Terminal className="w-3.5 h-3.5 text-[#163300]" />
                <span>Wise Career Intelligence</span>
              </div>

              <h1 className="font-wise-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0e0f0c] leading-[1.05]">
                International standard <br className="hidden sm:inline" />
                <span className="text-[#163300]">job search tracking.</span>
              </h1>

              <p className="text-base text-[#454745] font-medium leading-relaxed max-w-2xl">
                Relational pipeline views, real-time analytics, and instant status updates designed for high-throughput applications without extra stress or fees.
              </p>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => setIsAppModalOpen(true)}
                className="wise-btn-primary inline-flex items-center space-x-2 px-6 py-3 rounded-full text-sm font-bold shadow-md"
              >
                <Plus className="w-4 h-4 text-[#0e0f0c]" />
                <span>New Application</span>
              </button>
              <button
                onClick={() => setIsIntModalOpen(true)}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-full text-sm font-bold bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#d8dcd5] transition-colors border border-[#d8dcd5]"
              >
                <CalendarCheck2 className="w-4 h-4 text-[#454745]" />
                <span>Schedule Round</span>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-2xl bg-[#320707]/10 border border-[#d03238]/30 text-[#d03238] text-xs flex items-center gap-2.5 font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 5 Wise KPI Metric Cards with Pre-filtered Routing */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* KPI 1: Total Applications */}
          <Link
            href="/applications"
            className="p-5 rounded-3xl bg-white border border-[#d8dcd5] shadow-xs hover:border-[#9fe870] hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between text-[#868685]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#454745]">Total Apps</span>
              <div className="w-8 h-8 rounded-full bg-[#f4f6f3] flex items-center justify-center text-[#0e0f0c]">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-wise-display text-3xl font-black text-[#0e0f0c]">
                {loading ? '…' : summary?.kpis.totalApplications ?? 0}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-[#868685]">
                <span>All records</span>
                <span className="group-hover:text-[#0e0f0c] font-bold transition-colors flex items-center">
                  View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* KPI 2: Active Pipeline */}
          <Link
            href="/applications?filter=active"
            className="p-5 rounded-3xl bg-white border border-[#d8dcd5] shadow-xs hover:border-[#9fe870] hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between text-[#868685]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#454745]">Active</span>
              <div className="w-8 h-8 rounded-full bg-[#ffd11a]/20 flex items-center justify-center text-[#b86700]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-wise-display text-3xl font-black text-[#0e0f0c]">
                {loading ? '…' : summary?.kpis.activePipeline ?? 0}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-[#868685]">
                <span>In-progress</span>
                <span className="group-hover:text-[#0e0f0c] font-bold transition-colors flex items-center">
                  View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* KPI 3: Scheduled Interviews */}
          <Link
            href="/interviews"
            className="p-5 rounded-3xl bg-white border border-[#d8dcd5] shadow-xs hover:border-[#9fe870] hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between text-[#868685]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#454745]">Interviews</span>
              <div className="w-8 h-8 rounded-full bg-[#9fe870]/30 flex items-center justify-center text-[#163300]">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-wise-display text-3xl font-black text-[#0e0f0c]">
                {loading ? '…' : summary?.kpis.totalInterviews ?? 0}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-[#868685]">
                <span>Rounds</span>
                <span className="group-hover:text-[#0e0f0c] font-bold transition-colors flex items-center">
                  View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* KPI 4: Offer Rate */}
          <Link
            href="/applications?status=Offer Received"
            className="p-5 rounded-3xl bg-white border border-[#d8dcd5] shadow-xs hover:border-[#9fe870] hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between text-[#868685]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#454745]">Offer Rate</span>
              <div className="w-8 h-8 rounded-full bg-[#2ead4b]/20 flex items-center justify-center text-[#054d28]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-wise-display text-3xl font-black text-[#0e0f0c]">
                {loading ? '…' : `${summary?.kpis.offerRate ?? 0}%`}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-[#868685]">
                <span>{summary ? `${summary.kpis.offerCount} offers` : 'Offers'}</span>
                <span className="group-hover:text-[#0e0f0c] font-bold transition-colors flex items-center">
                  View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>

          {/* KPI 5: Rejection Rate */}
          <Link
            href="/applications?status=Rejected"
            className="p-5 rounded-3xl bg-white border border-[#d8dcd5] shadow-xs hover:border-[#9fe870] hover:shadow-md transition-all flex flex-col justify-between space-y-3 col-span-2 sm:col-span-1 group"
          >
            <div className="flex items-center justify-between text-[#868685]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#454745]">Rejections</span>
              <div className="w-8 h-8 rounded-full bg-[#d03238]/15 flex items-center justify-center text-[#a7000d]">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="font-wise-display text-3xl font-black text-[#0e0f0c]">
                {loading ? '…' : `${summary?.kpis.rejectionRate ?? 0}%`}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-[#868685]">
                <span>{summary ? `${summary.kpis.rejectedCount} rejected` : 'Rejected'}</span>
                <span className="group-hover:text-[#0e0f0c] font-bold transition-colors flex items-center">
                  View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* 3 Live Views Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live View 1: Follow-ups This Week */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-[#d8dcd5] p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e8ebe6] mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffd11a]" />
                  <h2 className="font-wise-display text-base font-black text-[#0e0f0c]">
                    Follow-ups This Week
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#0e0f0c] font-bold bg-[#e8ebe6] px-2.5 py-1 rounded-full border border-[#d8dcd5]">
                  {summary?.followUpsThisWeek.length ?? 0} due
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-[#868685] font-medium">Loading follow-ups…</div>
              ) : summary?.followUpsThisWeek && summary.followUpsThisWeek.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {summary.followUpsThisWeek.map((app) => (
                    <Link
                      key={app.id}
                      href={`/applications?status=${encodeURIComponent(app.status)}`}
                      className="p-4 rounded-2xl bg-[#f4f6f3] border border-[#d8dcd5] hover:border-[#9fe870] transition-all flex items-center justify-between block group"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] font-bold text-[#0e0f0c] bg-white px-2 py-0.5 rounded-md border border-[#d8dcd5]">
                            {app.app_code}
                          </span>
                          <span className="text-xs font-bold text-[#0e0f0c] truncate">{app.company_name}</span>
                        </div>
                        <p className="text-xs text-[#454745] font-medium truncate">{app.job_title}</p>
                        <div className="flex items-center space-x-1.5 pt-1 font-mono text-[11px] text-[#b86700] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Follow up: {formatDate(app.follow_up_date)}</span>
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#9fe870] mx-auto" />
                  <p className="text-xs font-bold text-[#454745]">No follow-ups due in the next 7 days.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#e8ebe6]">
              <Link
                href="/applications"
                className="text-xs font-bold text-[#0e0f0c] hover:text-[#163300] flex items-center justify-between group"
              >
                <span>View all applications →</span>
                <ChevronRight className="w-4 h-4 text-[#868685] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Live View 2: Upcoming Interviews */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#d8dcd5] p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e8ebe6] mb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#9fe870]" />
                  <h2 className="font-wise-display text-base font-black text-[#0e0f0c]">
                    Upcoming Interviews
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#0e0f0c] font-bold bg-[#e8ebe6] px-2.5 py-1 rounded-full border border-[#d8dcd5]">
                  {summary?.upcomingInterviews.length ?? 0} scheduled
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-[#868685] font-medium">Loading upcoming interviews…</div>
              ) : summary?.upcomingInterviews && summary.upcomingInterviews.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {summary.upcomingInterviews.map((int) => (
                    <div
                      key={int.id}
                      className="p-4 rounded-2xl bg-[#f4f6f3] border border-[#d8dcd5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#9fe870] transition-all"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-mono text-[11px] font-bold text-[#0e0f0c] bg-white px-2 py-0.5 rounded-md border border-[#d8dcd5]">
                            {int.int_code}
                          </span>
                          <span className="text-xs font-bold text-[#0e0f0c]">
                            {int.application.company_name}
                          </span>
                          <span className="text-xs text-[#454745] font-medium">— {int.application.job_title}</span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-[#454745]">
                          <span className="font-bold text-[#0e0f0c]">{int.round_type}</span>
                          <span className="text-[#d8dcd5]">•</span>
                          <span className="font-mono text-[11px] text-[#0e0f0c] font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#868685]" />
                            {formatDateTime(int.interview_datetime)}
                          </span>
                        </div>

                        {int.interviewers && (
                          <p className="text-[11px] text-[#868685] font-medium">Interviewers: {int.interviewers}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 self-start sm:self-center">
                        <OutcomeBadge outcome={int.outcome} />
                        {int.meeting_link && (
                          <a
                            href={int.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-white text-[#0e0f0c] border border-[#d8dcd5] hover:bg-[#9fe870] transition-colors shadow-xs"
                            title="Open Meeting Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <CalendarCheck2 className="w-8 h-8 text-[#9fe870] mx-auto" />
                  <p className="text-xs font-bold text-[#454745]">No upcoming interviews scheduled.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#e8ebe6] flex items-center justify-between">
              <span className="text-xs text-[#868685] font-medium">Live relational dataset</span>
              <Link
                href="/interviews?filter=upcoming"
                className="text-xs font-bold text-[#0e0f0c] hover:text-[#163300] flex items-center gap-1 group"
              >
                <span>View all interview rounds →</span>
                <ChevronRight className="w-4 h-4 text-[#868685] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Live View 3: Grouped by Status Analytics with Pre-filtered Links */}
        <section className="bg-white rounded-3xl border border-[#d8dcd5] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#e8ebe6]">
            <div>
              <h2 className="font-wise-display text-lg font-black text-[#0e0f0c]">
                Pipeline Breakdown by Status
              </h2>
              <p className="text-xs text-[#868685] font-medium">Click any stage card to filter the applications registry.</p>
            </div>
            <span className="font-mono text-xs text-[#0e0f0c] font-bold bg-[#e8ebe6] px-3 py-1 rounded-full border border-[#d8dcd5]">
              Total: {summary?.kpis.totalApplications ?? 0}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {APPLICATION_STATUSES.map((status) => {
              const count = summary?.statusBreakdown[status] ?? 0;
              const total = summary?.kpis.totalApplications || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <Link
                  key={status}
                  href={`/applications?status=${encodeURIComponent(status)}`}
                  className="p-4 rounded-2xl bg-[#f4f6f3] border border-[#d8dcd5] hover:border-[#9fe870] hover:shadow-sm transition-all flex flex-col justify-between space-y-3 block group"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="font-wise-display text-xl font-black text-[#0e0f0c]">{count}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-[#d8dcd5] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-[#9fe870]"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-[#454745] font-bold">
                      <span>{percentage}%</span>
                      <span className="group-hover:text-[#0e0f0c] transition-colors">View all →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modals */}
      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        onSave={handleCreateApplication}
      />

      <InterviewModal
        isOpen={isIntModalOpen}
        onClose={() => setIsIntModalOpen(false)}
        onSave={handleCreateInterview}
        applications={applicationsForSelect}
      />
    </div>
  );
}
