import type { Metadata } from 'next';
import './globals.css';
import { SessionProviderWrapper } from '@/components/SessionProviderWrapper';

export const metadata: Metadata = {
  title: 'Nanobane — Job Application & Interview Tracker',
  description: 'Global job application & interview tracking platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#e8ebe6] text-[#0e0f0c] min-h-screen flex flex-col font-inter selection:bg-[#9fe870] selection:text-[#0e0f0c]">
        <SessionProviderWrapper>
          <div className="relative z-10 flex-1 flex flex-col">{children}</div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
