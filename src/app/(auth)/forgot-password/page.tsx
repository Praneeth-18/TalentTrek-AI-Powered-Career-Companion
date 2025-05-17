"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Head from 'next/head';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { forgotPassword, forgotPasswordSubmit } = useAuth();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      await forgotPassword(username);
      setIsCodeSent(true);
      setMessage('Verification code has been sent to your email.');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      await forgotPasswordSubmit(username, code, newPassword);
      setMessage('Password has been reset successfully. You can now login with your new password.');
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>TalentTrek - Forgot Password</title>
      </Head>
      
      {/* Main container with background gradient - fixed position to go edge-to-edge */}
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
        {/* Apple Intelligence style background with stronger opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>
        <div className="absolute inset-0 backdrop-blur-3xl"></div>
        
        <div className="max-w-md w-full mx-auto rounded-xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 relative z-10">
          <div className="p-8">
            {/* Logo and Header */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Reset Password
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full my-2"></div>
            </div>
          
            {!isCodeSent ? (
              <form onSubmit={handleRequestCode} className="space-y-6">
                {error && (
                  <div className="text-red-500 text-sm p-3 bg-red-50/30 backdrop-blur-md border border-red-200 rounded-lg flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
                
                {message && (
                  <div className="text-green-500 text-sm p-3 bg-green-50/30 backdrop-blur-md border border-green-200 rounded-lg flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {message}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-white">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="block w-full pl-10 pr-3 py-3 border border-white/50 bg-white/10 backdrop-blur-xl rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-white/50 shadow-sm"
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
                      Sending Code...
                    </div>
                  ) : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                {error && (
                  <div className="text-red-500 text-sm p-3 bg-red-50/30 backdrop-blur-md border border-red-200 rounded-lg flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
                
                {message && (
                  <div className="text-green-500 text-sm p-3 bg-green-50/30 backdrop-blur-md border border-green-200 rounded-lg flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {message}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="code" className="block text-sm font-medium text-white">Verification Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="code"
                      type="text"
                      placeholder="Enter verification code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={isLoading}
                      className="block w-full pl-10 pr-3 py-3 border border-white/50 bg-white/10 backdrop-blur-xl rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-white/50 shadow-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-white">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="block w-full pl-10 pr-3 py-3 border border-white/50 bg-white/10 backdrop-blur-xl rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-white/50 shadow-sm"
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
                      Resetting Password...
                    </div>
                  ) : 'Reset Password'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setIsCodeSent(false)}
                  className="w-full mt-2 py-2 px-4 bg-transparent border border-white/30 hover:bg-white/10 text-white font-medium rounded-lg transition-all"
                >
                  Back to Request Code
                </button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-white">
                Remember your password?{' '}
                <Link 
                  href="/login" 
                  className="px-4 py-1 bg-white/30 hover:bg-white/40 text-white font-medium rounded-lg transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 