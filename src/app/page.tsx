'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Display a proper loading state while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-800">
      <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-4">TalentTrek</h1>
        <div className="flex items-center justify-center space-x-2 mt-6">
          <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 bg-primary rounded-full animate-bounce"></div>
        </div>
        <p className="mt-4 text-white/80">Preparing your experience...</p>
      </div>
    </div>
  );
}
