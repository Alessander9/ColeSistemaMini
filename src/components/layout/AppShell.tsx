'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      
      {/* Mobile Sidebar Drawer Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          {/* Sliding Panel */}
          <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-white dark:bg-slate-950 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <Sidebar isMobileDrawer onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </AppProvider>
  );
}
