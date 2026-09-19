import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Normalize /dashboard to / (main dashboard route in Magene)
  const targetPath = next === '/dashboard' ? '/' : next;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  // Return the user to login with error notice
  return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate+with+OAuth`);
}
