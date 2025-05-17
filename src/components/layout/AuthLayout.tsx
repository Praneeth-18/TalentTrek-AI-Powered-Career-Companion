'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  
  // Check if current route is an auth route
  const isAuthRoute = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/forgot-password' || 
    pathname === '/reset-password' || 
    pathname === '/verify-email';

  // If on auth routes, don't show the sidebar
  if (isAuthRoute || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
        {children}
      </div>
    );
  }

  // For authenticated routes, show the sidebar
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
} 