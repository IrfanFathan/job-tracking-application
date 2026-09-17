import { prisma } from './db';
import { calculateDaysSinceApplied, generateAppCode, generateIntCode } from './utils';
import { ApplicationInput, InterviewInput } from './validations';
import { createAdminClient } from './supabase/admin';

/**
 * Data Scoping Helpers: All functions require a validated `userId` (string UUID) derived from Supabase Auth session.
 * Application model includes `user_id` (UUID).
 * Interview model derives user ownership via `application: { user_id }`.
 */

export async function getUserApplications(userId: string) {
  const applications = await prisma.application.findMany({
    where: { user_id: userId },
    orderBy: { application_date: 'desc' },
    include: {
      _count: {
        select: { interviews: true },
      },
    },
  });

  return applications.map((app) => ({
    ...app,
    days_since_applied: calculateDaysSinceApplied(app.application_date, app.status),
    interview_count: app._count.interviews,
  }));
}

export async function getApplicationById(userId: string, id: number) {
  const app = await prisma.application.findFirst({
    where: { id, user_id: userId },
    include: {
      interviews: {
        orderBy: { interview_datetime: 'desc' },
      },
    },
  });

  if (!app) return null;

  return {
    ...app,
    days_since_applied: calculateDaysSinceApplied(app.application_date, app.status),
  };
}

export async function createApplication(userId: string, validatedData: ApplicationInput) {
  // Auto-generate app_code server-side
  const lastApp = await prisma.application.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  const nextSeq = (lastApp?.id || 0) + 1;
  const appCode = generateAppCode(nextSeq);

  const newApp = await prisma.application.create({
    data: {
      user_id: userId,
      app_code: appCode,
      company_name: validatedData.company_name,
      job_title: validatedData.job_title,
      role_type: validatedData.role_type,
      work_mode: validatedData.work_mode,
      location_details: validatedData.location_details || null,
      job_posting_url: validatedData.job_posting_url || null,
      notes: validatedData.notes || null,
      salary_range: validatedData.salary_range || null,
      application_date: new Date(validatedData.application_date),
      application_source: validatedData.application_source,
      referral_contact: validatedData.referral_contact || null,
      status: validatedData.status,
      follow_up_date: validatedData.follow_up_date ? new Date(validatedData.follow_up_date) : null,
    },
  });

  return {
    ...newApp,
    days_since_applied: calculateDaysSinceApplied(newApp.application_date, newApp.status),
  };
}

export async function updateApplication(userId: string, id: number, validatedData: ApplicationInput) {
  const existingApp = await prisma.application.findFirst({
    where: { id, user_id: userId },
    select: { id: true },
  });

  if (!existingApp) return null;

  const updatedApp = await prisma.application.update({
    where: { id },
    data: {
      company_name: validatedData.company_name,
      job_title: validatedData.job_title,
      role_type: validatedData.role_type,
      work_mode: validatedData.work_mode,
      location_details: validatedData.location_details || null,
      job_posting_url: validatedData.job_posting_url || null,
      notes: validatedData.notes || null,
      salary_range: validatedData.salary_range || null,
      application_date: new Date(validatedData.application_date),
      application_source: validatedData.application_source,
      referral_contact: validatedData.referral_contact || null,
      status: validatedData.status,
      follow_up_date: validatedData.follow_up_date ? new Date(validatedData.follow_up_date) : null,
    },
  });

  return {
    ...updatedApp,
    days_since_applied: calculateDaysSinceApplied(updatedApp.application_date, updatedApp.status),
  };
}

export async function patchApplicationStatus(userId: string, id: number, status: string) {
  const existingApp = await prisma.application.findFirst({
    where: { id, user_id: userId },
    select: { id: true },
  });

  if (!existingApp) return null;

  const updatedApp = await prisma.application.update({
    where: { id },
    data: { status },
  });

  return {
    ...updatedApp,
    days_since_applied: calculateDaysSinceApplied(updatedApp.application_date, updatedApp.status),
  };
}

export async function deleteApplication(userId: string, id: number) {
  const existingApp = await prisma.application.findFirst({
    where: { id, user_id: userId },
    select: { id: true, app_code: true, company_name: true },
  });

  if (!existingApp) return null;

  await prisma.application.delete({
    where: { id },
  });

  return existingApp;
}

export async function getUserInterviews(userId: string) {
  const interviews = await prisma.interview.findMany({
    where: {
      application: {
        user_id: userId,
      },
    },
    orderBy: { interview_datetime: 'asc' },
    include: {
      application: {
        select: {
          id: true,
          app_code: true,
          company_name: true,
          job_title: true,
          status: true,
        },
      },
    },
  });

  return interviews;
}

export async function getInterviewById(userId: string, id: number) {
  const interview = await prisma.interview.findFirst({
    where: {
      id,
      application: {
        user_id: userId,
      },
    },
    include: {
      application: {
        select: {
          id: true,
          app_code: true,
          company_name: true,
          job_title: true,
          status: true,
        },
      },
    },
  });

  return interview;
}

export async function createInterview(userId: string, validatedData: InterviewInput) {
  // Ensure target application belongs to user
  const existingApp = await prisma.application.findFirst({
    where: { id: validatedData.application_id, user_id: userId },
    select: { id: true },
  });

  if (!existingApp) return { error: 'APPLICATION_NOT_FOUND' };

  // Auto-generate int_code server-side
  const lastInt = await prisma.interview.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  const nextSeq = (lastInt?.id || 0) + 1;
  const intCode = generateIntCode(nextSeq);

  const newInterview = await prisma.interview.create({
    data: {
      int_code: intCode,
      application_id: validatedData.application_id,
      round_type: validatedData.round_type,
      interview_datetime: new Date(validatedData.interview_datetime),
      interviewers: validatedData.interviewers || null,
      meeting_link: validatedData.meeting_link || null,
      prep_notes: validatedData.prep_notes || null,
      feedback: validatedData.feedback || null,
      outcome: validatedData.outcome,
      thank_you_sent: validatedData.thank_you_sent,
    },
    include: {
      application: {
        select: {
          id: true,
          app_code: true,
          company_name: true,
          job_title: true,
          status: true,
        },
      },
    },
  });

  return { data: newInterview };
}

export async function updateInterview(userId: string, id: number, validatedData: InterviewInput) {
  // Verify interview belongs to user
  const existingInt = await prisma.interview.findFirst({
    where: {
      id,
      application: { user_id: userId },
    },
    select: { id: true },
  });

  if (!existingInt) return { error: 'INTERVIEW_NOT_FOUND' };

  // Verify target application belongs to user
  const existingApp = await prisma.application.findFirst({
    where: { id: validatedData.application_id, user_id: userId },
    select: { id: true },
  });

  if (!existingApp) return { error: 'APPLICATION_NOT_FOUND' };

  const updatedInterview = await prisma.interview.update({
    where: { id },
    data: {
      application_id: validatedData.application_id,
      round_type: validatedData.round_type,
      interview_datetime: new Date(validatedData.interview_datetime),
      interviewers: validatedData.interviewers || null,
      meeting_link: validatedData.meeting_link || null,
      prep_notes: validatedData.prep_notes || null,
      feedback: validatedData.feedback || null,
      outcome: validatedData.outcome,
      thank_you_sent: validatedData.thank_you_sent,
    },
    include: {
      application: {
        select: {
          id: true,
          app_code: true,
          company_name: true,
          job_title: true,
          status: true,
        },
      },
    },
  });

  return { data: updatedInterview };
}

export async function patchInterviewOutcomeOrThankYou(
  userId: string,
  id: number,
  updateData: { outcome?: string; thank_you_sent?: boolean }
) {
  const existingInt = await prisma.interview.findFirst({
    where: {
      id,
      application: { user_id: userId },
    },
    select: { id: true },
  });

  if (!existingInt) return null;

  const updatedInterview = await prisma.interview.update({
    where: { id },
    data: updateData,
    include: {
      application: {
        select: {
          id: true,
          app_code: true,
          company_name: true,
          job_title: true,
          status: true,
        },
      },
    },
  });

  return updatedInterview;
}

export async function deleteInterview(userId: string, id: number) {
  const existingInt = await prisma.interview.findFirst({
    where: {
      id,
      application: { user_id: userId },
    },
    select: { id: true, int_code: true, round_type: true },
  });

  if (!existingInt) return null;

  await prisma.interview.delete({
    where: { id },
  });

  return existingInt;
}

export async function getUserDashboardSummary(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  sevenDaysLater.setHours(23, 59, 59, 999);

  const now = new Date();

  const [
    totalApplications,
    activePipeline,
    totalInterviews,
    offerCount,
    rejectedCount,
    eligibleApplicationsCount,
    statusGroups,
    followUps,
    upcomingInterviews,
  ] = await Promise.all([
    prisma.application.count({ where: { user_id: userId } }),
    prisma.application.count({
      where: {
        user_id: userId,
        status: { in: ['Bookmarked', 'Applied', 'Screening', 'Interviewing'] },
      },
    }),
    prisma.interview.count({
      where: {
        application: { user_id: userId },
      },
    }),
    prisma.application.count({
      where: { user_id: userId, status: 'Offer Received' },
    }),
    prisma.application.count({
      where: { user_id: userId, status: 'Rejected' },
    }),
    prisma.application.count({
      where: { user_id: userId, status: { not: 'Bookmarked' } },
    }),
    prisma.application.groupBy({
      by: ['status'],
      where: { user_id: userId },
      _count: { status: true },
    }),
    prisma.application.findMany({
      where: {
        user_id: userId,
        follow_up_date: {
          gte: today,
          lte: sevenDaysLater,
        },
        status: { notIn: ['Rejected', 'Withdrawn', 'Offer Received'] },
      },
      orderBy: { follow_up_date: 'asc' },
    }),
    prisma.interview.findMany({
      where: {
        application: { user_id: userId },
        interview_datetime: {
          gte: now,
        },
      },
      orderBy: { interview_datetime: 'asc' },
      include: {
        application: {
          select: {
            id: true,
            app_code: true,
            company_name: true,
            job_title: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const denominator = eligibleApplicationsCount > 0 ? eligibleApplicationsCount : 0;
  const offerRate = denominator > 0 ? Math.round((offerCount / denominator) * 1000) / 10 : 0;
  const rejectionRate = denominator > 0 ? Math.round((rejectedCount / denominator) * 1000) / 10 : 0;

  const statusCountsMap: Record<string, number> = {};
  statusGroups.forEach((group) => {
    statusCountsMap[group.status] = group._count.status;
  });

  const formattedFollowUps = followUps.map((app) => ({
    ...app,
    days_since_applied: calculateDaysSinceApplied(app.application_date, app.status),
  }));

  return {
    kpis: {
      totalApplications,
      activePipeline,
      totalInterviews,
      offerRate,
      rejectionRate,
      offerCount,
      rejectedCount,
      eligibleApplicationsCount,
    },
    statusBreakdown: statusCountsMap,
    followUpsThisWeek: formattedFollowUps,
    upcomingInterviews,
  };
}

export async function getAccountSummary(userId: string, email?: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  const [applicationCount, interviewCount] = await Promise.all([
    prisma.application.count({ where: { user_id: userId } }),
    prisma.interview.count({ where: { application: { user_id: userId } } }),
  ]);

  return {
    id: userId,
    email: email || '',
    name: profile?.name || '',
    role: profile?.role || 'user',
    created_at: profile?.created_at || new Date(),
    application_count: applicationCount,
    interview_count: interviewCount,
  };
}

export async function deleteUserAccount(userId: string) {
  const summary = await getAccountSummary(userId);

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    // Fallback: delete profile directly via Prisma if admin API fails
    await prisma.profile.delete({ where: { id: userId } });
  }

  return summary;
}
