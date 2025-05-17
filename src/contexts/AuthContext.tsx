'use client';

import {
  createContext, useContext, useState, useEffect, ReactNode
} from 'react';
import {
  signIn as awsSignIn,
  signUp as awsSignUp,
  signOut as awsSignOut,
  confirmSignUp as awsConfirmSignUp,
  confirmSignIn as awsConfirmSignIn,
  getCurrentUser as awsGetCurrentUser,
  fetchUserAttributes as awsFetchUserAttributes,
  resetPassword as awsResetPassword,
  resendSignUpCode as awsResendSignUpCode,
  confirmResetPassword as awsConfirmResetPassword
} from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { configureAws } from '@/lib/aws-config';

// Configure AWS on client side
if (typeof window !== 'undefined') {
  configureAws();
}

// Define types for authentication
interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string,
         name: string) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  forgotPasswordSubmit: (username: string, code: string, newPassword: string) => Promise<void>;
  resendVerificationCode: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { 
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await awsGetCurrentUser();
      const attributes = await awsFetchUserAttributes();
      
      // Create a proper user object with id, email and name
      setUser({
        id: currentUser.userId,
        username: currentUser.userId, // keep for backward compatibility
        email: attributes.email || '',
        name: attributes.name || (attributes.given_name ? `${attributes.given_name} ${attributes.family_name || ''}`.trim() : '')
      });
      
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const handleSignIn = async (username: string, password: string) => {
    try {
      // First try to sign out any existing user to prevent UserAlreadyAuthenticatedException
      try {
        await awsSignOut();
        console.log('Signed out existing user');
      } catch (signOutError) {
        // It's okay if this fails, it just means no user was signed in
        console.log('No existing user to sign out');
      }
      
      // Now proceed with sign in
      const { isSignedIn } = await awsSignIn({
        username,
        password
      });

      if (isSignedIn) {
        await checkAuthState();
        
        // Set a custom cookie for middleware detection
        document.cookie = "amplifyAuthenticated=true; path=/; max-age=3600";
        
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // Sign Up
  const handleSignUp = async (username: string, email: string, password: string, name: string) => {
    try {
      // Extract first and last name from the full name for Cognito
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';

      // Register user in AWS Cognito
      const { userId, isSignUpComplete } = await awsSignUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
          },
          autoSignIn: false
        }
      });
      
      // Store username in session for verification page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingUsername', username);
        sessionStorage.setItem('pendingEmail', email);
        sessionStorage.setItem('pendingName', name);
        // Store password temporarily for auto-signin after verification
        // This will be removed after verification is complete
        sessionStorage.setItem('pendingPassword', password);
        
        // Store userId securely if it exists, otherwise use a generated ID
        if (userId) {
          sessionStorage.setItem('pendingUserId', userId);
        } else {
          // Generate a temporary ID that will be replaced by Cognito's ID later
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          sessionStorage.setItem('pendingUserId', tempId);
        }
      }
      
      router.push(`/verify-email?username=${encodeURIComponent(username)}`);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await awsSignOut();
      setUser(null);
      setIsAuthenticated(false);
      
      // Remove the custom cookie
      document.cookie = "amplifyAuthenticated=; path=/; max-age=0";
      
      router.push('/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Confirm Sign Up (email verification)
  const handleConfirmSignUp = async (username: string, code: string) => {
    try {
      const result = await awsConfirmSignUp({
        username,
        confirmationCode: code
      });
      
      // After verification, create the user in our database
      if (typeof window !== 'undefined') {
        const email = sessionStorage.getItem('pendingEmail') || '';
        const name = sessionStorage.getItem('pendingName') || '';
        
        try {
          // Sign in the user to get their actual Cognito ID
          await awsSignIn({
            username,
            password: sessionStorage.getItem('pendingPassword') || ''
          });
          
          // Get current user and attributes
          const currentUser = await awsGetCurrentUser();
          
          // Use the Cognito user ID for our database
          const userId = currentUser.userId;
          
          console.log('Creating user in database with ID:', userId);
          
          // Create user in database
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              email,
              name
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to create user in database', await response.text());
          } else {
            console.log('User created successfully in database');
          }
        } catch (dbError) {
          console.error('Error creating user in database:', dbError);
        }
        
        // Clear stored user data from session storage
        sessionStorage.removeItem('pendingUsername');
        sessionStorage.removeItem('pendingEmail');
        sessionStorage.removeItem('pendingName');
        sessionStorage.removeItem('pendingUserId');
        sessionStorage.removeItem('pendingPassword');
      }
      
      router.push('/login');
    } catch (error: any) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  };

  // Forgot Password
  const handleForgotPassword = async (username: string) => {
    try {
      await awsResetPassword({
        username
      });
      
      router.push('/reset-password');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  // Confirm Forgot Password
  const handleForgotPasswordSubmit = async (username: string, code: string, newPassword: string) => {
    try {
      await awsConfirmResetPassword({
        username,
        confirmationCode: code,
        newPassword
      });
      
      router.push('/login');
    } catch (error: any) {
      console.error('Confirm forgot password error:', error);
      throw error;
    }
  };

  // Resend Verification Code
  const handleResendVerificationCode = async (username: string) => {
    try {
      await awsResendSignUpCode({
        username
      });
    } catch (error: any) {
      console.error('Resend verification code error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        confirmSignUp: handleConfirmSignUp,
        forgotPassword: handleForgotPassword,
        forgotPasswordSubmit: handleForgotPasswordSubmit,
        resendVerificationCode: handleResendVerificationCode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Authentication hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 