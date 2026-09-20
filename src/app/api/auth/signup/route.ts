import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signUpSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validatedData = signUpSchema.parse(json);

    const emailNormalized = validatedData.email.toLowerCase().trim();
    const supabaseAdmin = createAdminClient();

    // Check if user already exists
    const { data: existingData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingData?.users?.find(
      (u) => u.email?.toLowerCase() === emailNormalized
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Log in with your password, then link Google from Account Settings.' },
        { status: 400 }
      );
    }

    // Create user via Supabase Auth Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNormalized,
      password: validatedData.password,
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.name.trim(),
        name: validatedData.name.trim(),
      },
    });

    if (createError || !newUser.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user account' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        id: newUser.user.id,
        email: newUser.user.email,
        name: validatedData.name.trim(),
        role: 'user',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'An unexpected database error occurred during registration.' },
      { status: 500 }
    );
  }
}
