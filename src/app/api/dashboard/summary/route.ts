import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserDashboardSummary } from '@/lib/dataScoping';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await getUserDashboardSummary(user.id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard summary' }, { status: 500 });
  }
}
