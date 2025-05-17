"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const [verificationCode, setVerificationCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirmSignUp, resendVerificationCode } = useAuth();

  useEffect(() => {
    // Get username from URL parameters or session storage
    const usernameParam = searchParams.get('username');
    const storedUsername = typeof window !== 'undefined' ? sessionStorage.getItem('pendingUsername') : null;
    
    if (usernameParam) {
      setUsername(usernameParam);
    } else if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!username) {
      setError('Username is required');
      setIsLoading(false);
      return;
    }
    
    try {
      await confirmSignUp(username, verificationCode);
      setSuccess(true);
      // Clear stored username from session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingUsername');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.message || 'Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!username) {
      setError('Please enter your username');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await resendVerificationCode(username);
      setError(''); // Clear any previous errors
      setSuccess(false); // Reset success state
      alert('A new verification code has been sent to your email');
    } catch (error: any) {
      console.error('Error resending code:', error);
      setError(error.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md w-full mx-auto rounded-xl overflow-hidden shadow-2xl bg-white backdrop-blur-lg border border-gray-100">
        <div className="relative">
          {/* Top gradient banner */}
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl"></div>
          
          {/* Success header */}
          <div className="relative pt-8 pb-6 px-8 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg z-10 mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">Email Verified!</h3>
            <p className="text-white/80 text-lg">Your account has been successfully verified</p>
          </div>
        </div>
        
        <div className="p-8 pt-2">
          <Link 
            href="/login" 
            className="block w-full py-3 px-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Proceed to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto rounded-xl overflow-hidden shadow-2xl bg-white backdrop-blur-lg border border-gray-100">
      <div className="relative">
        {/* Top gradient banner */}
        <div className="absolute inset-0 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl"></div>
        
        {/* Logo and Header */}
        <div className="relative pt-8 pb-6 px-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg z-10 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">Verify Your Email</h3>
          <p className="text-white/80 text-lg">Enter the code sent to your email</p>
        </div>
      </div>
      
      <div className="p-8 pt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 shadow-sm"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">Verification Code</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="verificationCode"
                type="text"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isLoading}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 shadow-sm"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </div>
            ) : 'Verify Email'}
          </button>
          
          <div className="flex flex-col space-y-4">
            <button 
              type="button"
              onClick={handleResendCode}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-center" 
              disabled={isLoading}
            >
              Resend verification code
            </button>
            
            <div className="text-center">
              <p className="text-gray-600">
                Already verified?{' '}
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 