'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Lock, Trash2, AlertTriangle, Check, ShieldAlert, X, Link as LinkIcon } from 'lucide-react';

interface AccountSummary {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  application_count: number;
  interview_count: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState('');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form
  const [name, setName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google Link State
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }

      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const data: AccountSummary = await res.json();
        setSummary(data);
        setName(data.name || '');
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      } else {
        setProfileMessage({ type: 'success', text: 'Profile name updated successfully!' });
        fetchSettings();
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred while updating profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch('/api/user/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: 'none', newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      } else {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setNewPassword('');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred while changing password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/api/auth/callback?next=/settings`,
        },
      });

      if (error) {
        setPasswordMessage({ type: 'error', text: error.message || 'Failed to link Google account' });
        setLinkingGoogle(false);
      }
    } catch (err) {
      console.error('Link Google error:', err);
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred while linking Google account.' });
      setLinkingGoogle(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') {
      setDeleteError('Please type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete account.');
        setIsDeleting(false);
      } else {
        await supabase.auth.signOut();
        router.push('/login');
      }
    } catch (err) {
      console.error('Account deletion error:', err);
      setDeleteError('An unexpected error occurred during account deletion.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#9fe870] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#0e0f0c] tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-[#454745]">
          Manage your personal profile, Supabase Auth security, and account preferences.
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ebe6] shadow-sm">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#e8ebe6] text-[#0e0f0c] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#0e0f0c]">Profile Information</h2>
            <p className="text-xs text-[#454745]">Update your display name and view account metadata</p>
          </div>
        </div>

        {profileMessage && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            profileMessage.type === 'success'
              ? 'bg-[#9fe870]/15 text-[#163300] border border-[#9fe870]/30'
              : 'bg-[#320707]/5 text-[#d03238] border border-[#d03238]/30'
          }`}>
            {profileMessage.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#0e0f0c] uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#9fe870] focus:ring-2 focus:ring-[#9fe870]/20 text-[#0e0f0c] font-medium text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0e0f0c] uppercase tracking-wider mb-2">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={userEmail || summary?.email || ''}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 font-medium text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8ebe6] text-[#0e0f0c]">
              Role: <span className="capitalize">{summary?.role || 'user'}</span>
            </span>

            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 rounded-2xl bg-[#0e0f0c] hover:bg-gray-800 text-white font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {profileSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security / Password & Google OAuth Linking */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8ebe6] shadow-sm">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-[#e8ebe6] text-[#0e0f0c] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#0e0f0c]">Password & OAuth Security</h2>
            <p className="text-xs text-[#454745]">Update your password or link Google OAuth identity</p>
          </div>
        </div>

        {passwordMessage && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            passwordMessage.type === 'success'
              ? 'bg-[#9fe870]/15 text-[#163300] border border-[#9fe870]/30'
              : 'bg-[#320707]/5 text-[#d03238] border border-[#d03238]/30'
          }`}>
            {passwordMessage.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            {passwordMessage.text}
          </div>
        )}

        <div className="space-y-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0e0f0c] uppercase tracking-wider mb-2">
                New Password (min 8 characters)
              </label>
              <div className="flex gap-3">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#9fe870] focus:ring-2 focus:ring-[#9fe870]/20 text-[#0e0f0c] font-medium text-sm outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-6 py-3 rounded-2xl bg-[#0e0f0c] hover:bg-gray-800 text-white font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
                >
                  {passwordSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#0e0f0c]">Google OAuth Account Linking</p>
              <p className="text-xs text-[#454745] mt-0.5">
                Link your Google account for single sign-on using the same email address.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLinkGoogle}
              disabled={linkingGoogle}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-gray-50 text-[#0e0f0c] font-bold text-xs border border-gray-200 transition-all flex items-center gap-2 flex-shrink-0 shadow-xs disabled:opacity-50"
            >
              {linkingGoogle ? (
                <div className="w-4 h-4 border-2 border-[#0e0f0c] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                  Link Google Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d03238]/30 shadow-sm">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-[#d03238]/10">
          <div className="w-10 h-10 rounded-xl bg-[#320707]/10 text-[#d03238] flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#d03238]">Danger Zone</h2>
            <p className="text-xs text-[#454745]">Permanently delete your user account and all associated tracker data</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#320707]/5 border border-[#d03238]/20">
          <div>
            <p className="text-sm font-bold text-[#0e0f0c]">Delete Account & Associated Data</p>
            <p className="text-xs text-[#454745] mt-1">
              Deleting your account will permanently remove all stored applications, interview rounds, and notes. This action cannot be undone.
            </p>
          </div>

          <button
            onClick={() => {
              setDeleteConfirmText('');
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-[#d03238] hover:bg-[#a72027] text-white font-extrabold text-sm transition-all flex-shrink-0 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Cascade Account Deletion Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#320707]/10 text-[#d03238] flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-[#0e0f0c] tracking-tight mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-[#454745] mb-6">
              You are about to permanently delete your account (<strong className="text-[#0e0f0c]">{userEmail || summary?.email}</strong>). The following associated data will be cascades-deleted immediately:
            </p>

            {/* Cascade Statistics Breakdown */}
            <div className="space-y-3 bg-[#e8ebe6]/40 p-4 rounded-2xl border border-gray-200 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#454745] font-medium">Applications Record Count</span>
                <span className="font-black text-[#0e0f0c] px-2.5 py-0.5 rounded-full bg-white border border-gray-200">
                  {summary?.application_count ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#454745] font-medium">Interview Rounds Count</span>
                <span className="font-black text-[#0e0f0c] px-2.5 py-0.5 rounded-full bg-white border border-gray-200">
                  {summary?.interview_count ?? 0}
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-[#320707]/10 text-[#d03238] text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0e0f0c] uppercase tracking-wider mb-2">
                  Type <span className="text-[#d03238]">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#d03238] focus:ring-2 focus:ring-[#d03238]/20 text-[#0e0f0c] font-bold text-sm outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#0e0f0c] font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'delete my account'}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#d03238] hover:bg-[#a72027] text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Delete Everything'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
