import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { deleteUserAccount, getAccountSummary } from '@/lib/dataScoping';
import { updateProfileSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await getAccountSummary(user.id, user.email);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to fetch user settings:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while fetching user settings.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const validatedData = updateProfileSchema.parse(json);

    const updatedProfile = await prisma.profile.upsert({
      where: { id: user.id },
      update: { name: validatedData.name.trim() },
      create: { id: user.id, name: validatedData.name.trim(), role: 'user' },
    });

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while updating profile.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedSummary = await deleteUserAccount(user.id);

    return NextResponse.json({
      success: true,
      message: 'Account and all associated application data permanently deleted',
      deleted_summary: deletedSummary,
    });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while deleting account.' },
      { status: 500 }
    );
  }
}
