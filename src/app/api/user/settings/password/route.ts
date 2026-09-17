import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { changePasswordSchema } from '@/lib/validations';

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const validatedData = changePasswordSchema.parse(json);

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Failed to change password:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred while updating password.' },
      { status: 500 }
    );
  }
}
