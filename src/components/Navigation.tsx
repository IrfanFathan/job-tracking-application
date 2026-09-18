'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Calendar, Settings, LogOut } from 'lucide-react';
import { NanobaneLogo } from '@/components/NanobaneLogo';

interface NavigationProps {
  onNewApplication?: () => void;
  onNewInterview?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onNewApplication, onNewInterview }) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/applications', label: 'Applications' },
    { href: '/interviews', label: 'Interviews' },
  ];

  // Hide nav links on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    async function getUserSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setUserName(
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'User'
        );
      }
    }

    getUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        setUserName(
          currentUser.user_metadata?.name ||
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split('@')[0] ||
          'User'
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#ffffff] border-b border-[#d8dcd5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark with Nanobane Icon */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <NanobaneLogo size={36} className="group-hover:scale-105 transition-transform" />
              <span className="font-wise-display font-black text-xl text-[#0e0f0c] tracking-tight">
                Nanobane
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {!isAuthPage && user && (
              <nav className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-[#e8ebe6] text-[#0e0f0c]'
                          : 'text-[#454745] hover:text-[#0e0f0c] hover:bg-[#f4f6f3]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Action CTAs & User Profile Pill */}
          <div className="flex items-center space-x-3">
            {!isAuthPage && user ? (
              <>
                {onNewApplication && (
                  <button
                    onClick={onNewApplication}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] transition-all transform hover:scale-[1.02] shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-[#0e0f0c]" />
                    <span className="hidden sm:inline">New Application</span>
                  </button>
                )}

                {onNewInterview && (
                  <button
                    onClick={onNewInterview}
                    className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[#e8ebe6] text-[#0e0f0c] hover:bg-[#dce1d9] transition-all"
                  >
                    <Calendar className="w-4 h-4 text-[#0e0f0c]" />
                    <span>Schedule Interview</span>
                  </button>
                )}

                {/* Profile Pill & Settings Link */}
                <div className="flex items-center space-x-1 pl-2 border-l border-gray-200">
                  <Link
                    href="/settings"
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold ${
                      pathname === '/settings'
                        ? 'bg-[#0e0f0c] text-white border-[#0e0f0c]'
                        : 'bg-[#f4f6f3] hover:bg-[#e8ebe6] text-[#0e0f0c] border-gray-200'
                    }`}
                    title="Account Settings"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#9fe870] text-[#0e0f0c] flex items-center justify-center font-black text-[10px]">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate hidden md:inline">
                      {userName}
                    </span>
                    <Settings className="w-3.5 h-3.5 text-gray-500" />
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-full text-gray-500 hover:text-[#d03238] hover:bg-[#320707]/5 transition-all"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              !isAuthPage && (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-full text-sm font-bold text-[#0e0f0c] hover:bg-[#f4f6f3] transition-all"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 rounded-full text-sm font-bold bg-[#9fe870] text-[#0e0f0c] hover:bg-[#cdffad] transition-all shadow-xs"
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile Navigation sub-bar */}
        {!isAuthPage && user && (
          <div className="flex md:hidden items-center justify-between space-x-2 py-2 border-t border-[#d8dcd5]">
            <div className="flex space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-[#e8ebe6] text-[#0e0f0c]'
                        : 'text-[#454745] hover:text-[#0e0f0c]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <Link
              href="/settings"
              className={`p-1.5 rounded-full text-xs font-semibold ${
                pathname === '/settings' ? 'bg-[#0e0f0c] text-white' : 'text-[#454745]'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
