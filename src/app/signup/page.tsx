'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { NanobaneLogo } from '@/components/NanobaneLogo';

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
          data: {
            full_name: name.trim(),
            name: name.trim(),
          },
        },
      });

      if (signUpErr) {
        if (signUpErr.message.includes('already registered') || signUpErr.status === 400) {
          setError('This email is already registered. Log in with your password, then link Google from Account Settings.');
        } else {
          setError(signUpErr.message || 'Failed to create account.');
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccessMsg('Account created successfully! Please check your email inbox to confirm your registration, or log in.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An unexpected error occurred during registration.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (oauthError) {
        setError(oauthError.message || 'Failed to initialize Google Sign Up');
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError('Failed to connect to Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#e8ebe6]/40">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <NanobaneLogo size={48} className="mx-auto mb-4 shadow-sm" />
        <h1 className="text-3xl font-black text-[#0e0f0c] tracking-tight">
          Create Account
        </h1>
        <p className="mt-2 text-sm text-[#454745]">
          Start tracking your job applications with a personal account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-3xl border border-[#e8ebe6] sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-[#320707]/5 border border-[#d03238]/30 flex items-center gap-3 text-[#d03238]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-[#9fe870]/20 border border-[#9fe870]/40 flex items-center gap-3 text-[#163300]">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-[#2ead4b]" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full py-3.5 px-4 mb-6 rounded-2xl bg-white hover:bg-gray-50 active:scale-[0.99] text-[#0e0f0c] font-extrabold text-sm border-2 border-[#e8ebe6] transition-all flex items-center justify-center gap-3 shadow-xs disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-[#0e0f0c] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign Up with Google
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-wider">or register with email</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-[#0e0f0c] uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#9fe870] focus:ring-2 focus:ring-[#9fe870]/20 text-[#0e0f0c] placeholder:text-gray-400 font-medium transition-all text-sm outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#0e0f0c] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#9fe870] focus:ring-2 focus:ring-[#9fe870]/20 text-[#0e0f0c] placeholder:text-gray-400 font-medium transition-all text-sm outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-[#0e0f0c] uppercase tracking-wider mb-2">
                Password (min 8 characters)
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#9fe870] focus:ring-2 focus:ring-[#9fe870]/20 text-[#0e0f0c] placeholder:text-gray-400 font-medium transition-all text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#9fe870] hover:bg-[#8ee05b] active:scale-[0.99] text-[#0e0f0c] font-extrabold text-sm tracking-wide shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#0e0f0c] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-[#454745]">
              Already have an account?{' '}
              <Link href="/login" className="font-extrabold text-[#0e0f0c] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
