import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInterview, getUserInterviews } from '@/lib/dataScoping';
import { interviewSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const interviews = await getUserInterviews(user.id);

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Failed to fetch interviews:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while fetching interviews.' },
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
    const validatedData = interviewSchema.parse(json);

    const result = await createInterview(user.id, validatedData);

    if (result.error === 'APPLICATION_NOT_FOUND') {
      return NextResponse.json(
        { error: `Application with ID ${validatedData.application_id} does not exist or does not belong to you.` },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to create interview:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while creating the interview round.' },
      { status: 500 }
    );
  }
}
