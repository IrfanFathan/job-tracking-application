import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  deleteInterview,
  patchInterviewOutcomeOrThankYou,
  updateInterview,
} from '@/lib/dataScoping';
import { INTERVIEW_OUTCOMES } from '@/lib/enums';
import { interviewSchema } from '@/lib/validations';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid interview ID format' }, { status: 400 });
    }

    const json = await request.json();
    const validatedData = interviewSchema.parse(json);

    const result = await updateInterview(user.id, id, validatedData);

    if (result.error === 'INTERVIEW_NOT_FOUND') {
      return NextResponse.json({ error: `Interview round with ID ${id} not found` }, { status: 404 });
    }

    if (result.error === 'APPLICATION_NOT_FOUND') {
      return NextResponse.json(
        { error: `Application with ID ${validatedData.application_id} does not exist.` },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to update interview:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while updating the interview.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid interview ID format' }, { status: 400 });
    }

    const json = await request.json();
    const { outcome, thank_you_sent } = json;

    const updateData: Record<string, any> = {};

    if (outcome !== undefined) {
      if (!INTERVIEW_OUTCOMES.includes(outcome)) {
        return NextResponse.json({ error: 'Invalid interview outcome value' }, { status: 400 });
      }
      updateData.outcome = outcome;
    }

    if (thank_you_sent !== undefined) {
      updateData.thank_you_sent = Boolean(thank_you_sent);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for patch update' }, { status: 400 });
    }

    const updatedInterview = await patchInterviewOutcomeOrThankYou(user.id, id, updateData);

    if (!updatedInterview) {
      return NextResponse.json({ error: `Interview round with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(updatedInterview);
  } catch (error) {
    console.error('Failed to quick-patch interview:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while updating interview details.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid interview ID format' }, { status: 400 });
    }

    const deletedInt = await deleteInterview(user.id, id);

    if (!deletedInt) {
      return NextResponse.json({ error: `Interview round with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Interview ${deletedInt.int_code} (${deletedInt.round_type}) deleted successfully`,
    });
  } catch (error) {
    console.error('Failed to delete interview:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while deleting the interview round.' },
      { status: 500 }
    );
  }
}
