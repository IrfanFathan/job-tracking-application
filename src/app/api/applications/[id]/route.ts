import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  deleteApplication,
  patchApplicationStatus,
  updateApplication,
} from '@/lib/dataScoping';
import { APPLICATION_STATUSES } from '@/lib/enums';
import { applicationSchema } from '@/lib/validations';

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
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    const json = await request.json();
    const validatedData = applicationSchema.parse(json);

    const updatedApp = await updateApplication(user.id, id, validatedData);

    if (!updatedApp) {
      return NextResponse.json({ error: `Application with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(updatedApp);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to update application:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while updating the application.' },
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
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    const json = await request.json();
    const { status } = json;

    if (!status || !APPLICATION_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid application status value' }, { status: 400 });
    }

    const updatedApp = await patchApplicationStatus(user.id, id, status);

    if (!updatedApp) {
      return NextResponse.json({ error: `Application with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(updatedApp);
  } catch (error) {
    console.error('Failed to quick-change status:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while updating status.' },
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
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    const deletedApp = await deleteApplication(user.id, id);

    if (!deletedApp) {
      return NextResponse.json({ error: `Application with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Application ${deletedApp.app_code} (${deletedApp.company_name}) deleted successfully`,
    });
  } catch (error) {
    console.error('Failed to delete application:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while deleting the application.' },
      { status: 500 }
    );
  }
}
