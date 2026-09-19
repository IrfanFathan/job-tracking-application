import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserDashboardSummary } from '@/lib/dataScoping';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[dashboard/summary] Auth failed:', authError?.message ?? 'no user in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await getUserDashboardSummary(user.id);

    return NextResponse.json(summary);
  } catch (error: any) {
    // Structured server-side log: captures real Prisma/Postgres error, not just a generic message
    console.error('[dashboard/summary] Unexpected error:', {
      message: error?.message,
      code: error?.code,          // Prisma error code e.g. P2003
      meta: error?.meta,          // Prisma meta e.g. { field_name: 'applications_user_id_fkey (index)' }
      stack: error?.stack?.split('\n').slice(0, 5).join(' | '),
    });
    return NextResponse.json({ error: 'Failed to fetch dashboard summary' }, { status: 500 });
  }
}
