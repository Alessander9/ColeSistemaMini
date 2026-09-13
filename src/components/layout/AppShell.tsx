'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    // Full-screen layout for login — no nav/sidebar
    return (
      <AppProvider>
        <div className="min-h-screen">
          {children}
        </div>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <Navbar />
      <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </AppProvider>
  );
}
