import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApplication, getUserApplications } from '@/lib/dataScoping';
import { applicationSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formattedApplications = await getUserApplications(user.id);

    return NextResponse.json(formattedApplications);
  } catch (error: any) {
    console.error('[GET /api/applications] Unexpected error:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split('\n').slice(0, 5).join(' | '),
    });
    return NextResponse.json(
      { error: 'An unexpected database error occurred while fetching applications.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const validatedData = applicationSchema.parse(json);

    const newApp = await createApplication(user.id, validatedData);

    return NextResponse.json(newApp, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    // Structured server-side log: captures real Prisma/Postgres error (e.g. P2003 FK violation)
    console.error('[POST /api/applications] Unexpected error:', {
      message: error?.message,
      code: error?.code,          // Prisma error code e.g. P2003
      meta: error?.meta,          // Prisma meta e.g. { field_name, modelName }
      stack: error?.stack?.split('\n').slice(0, 5).join(' | '),
    });
    return NextResponse.json(
      { error: 'An unexpected database error occurred while creating the application.' },
      { status: 500 }
    );
  }
}
