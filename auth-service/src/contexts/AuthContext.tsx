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
} from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Use real AWS Cognito authentication
const authFns = {
  signIn: awsSignIn,
  signUp: awsSignUp,
  signOut: awsSignOut,
  confirmSignUp: awsConfirmSignUp,
  confirmMfa: awsConfirmSignIn,
  getCurrentUser: awsGetCurrentUser,
  fetchUserAttributes: awsFetchUserAttributes,
  resetPassword: awsResetPassword,
  resendSignUpCode: awsResendSignUpCode,
  confirmResetPassword: awsConfirmResetPassword
};

/* ---------- context typings ---------- */
interface AuthUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType?: 'interviewee' | 'interviewer';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string,
           firstName: string, lastName: string, userType: 'interviewee' | 'interviewer') => Promise<void>;
  confirmMfa: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  forgotPasswordSubmit: (username: string, code: string, newPassword: string) => Promise<void>;
  resendVerificationCode: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ========================  PROVIDER  ======================== */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser]             = useState<AuthUser | null>(null);
  const [loading, setLoading]       = useState(true);
  const [mfaSession, setMfaSession] = useState<any>(null);           // holds result from first sign‑in
  const navigate = useNavigate();

  useEffect(() => { void checkAuthState(); }, []);

  const checkAuthState = async () => {
    try {
      const curr = await authFns.getCurrentUser();
      const attrs = await authFns.fetchUserAttributes();
      setUser({
        username  : curr.username,
        email     : attrs.email        ?? '',
        firstName : attrs.given_name   ?? '',
        lastName  : attrs.family_name  ?? '',
        userType  : attrs['custom:userType'] as 'interviewee' | 'interviewer'
      });
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally { setLoading(false); }
  };

  /* ---------- SIGN‑IN with MFA handling ---------- */
  const handleSignIn = async (email: string, password: string) => {
    try {
      const resp: any = await authFns.signIn({
        username: email,
        password,
        options: { 
          // Remove authFlowType since USER_PASSWORD_AUTH is not enabled
        }
      });

      if (resp.isSignedIn) {
        await checkAuthState();
        toast.success('Signed in successfully!');
        navigate('/dashboard');
        return;
      }

      /* MFA challenge required */
      if (resp.nextStep?.signInStep?.startsWith('CONFIRM_SIGN_IN_WITH')) {
        setMfaSession(resp);                        // save session for confirm step
        toast('Enter the verification code sent to your device');
        navigate('/verify-mfa');
        return;
      }

      toast.error('Unexpected auth challenge.');    // fallback
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to sign in');
      throw err;
    }
  };

  /* ---------- CONFIRM MFA ---------- */
  const handleConfirmMfa = async (code: string) => {
    try {
      if (!mfaSession) throw new Error('No pending MFA session');
      
      // Use the challengeResponse parameter for AWS Cognito
      const out: any = await authFns.confirmMfa({
        challengeResponse: code
      });

      if (out.isSignedIn) {
        setMfaSession(null);
        await checkAuthState();
        toast.success('MFA verification successful!');
        navigate('/dashboard');
      } else {
        toast.error('Incorrect code. Try again.');
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to verify code');
      throw err;
    }
  };

  /* ---------- SIGN‑UP (NO autoSignIn) ---------- */
  const handleSignUp = async (username: string, email: string, password: string, firstName: string, lastName: string, userType: 'interviewee' | 'interviewer') => {
    try {
      const result = await authFns.signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
            name: `${firstName} ${lastName}`,
            'custom:userType': userType
          },
          autoSignIn: false // Disable auto sign-in
        }
      });
      
      // Always go to verification step
      toast.success('Verification code sent to your email!');
      navigate('/verify-email', { state: { email: username } });
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
      throw error;
    }
  };

  /* ---------- SIGN‑OUT ---------- */
  const handleSignOut = async () => {
    try {
      await authFns.signOut();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Signed out!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to sign out');
      throw err;
    }
  };

  /* ---------- EMAIL CONFIRM ---------- */
  const handleConfirmSignUp = async (email: string, code: string) => {
    try {
      await authFns.confirmSignUp({ username: email, confirmationCode: code });
      toast.success('Email verified—please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to verify email');
      throw err;
    }
  };

  /* ---------- PASSWORD RESET helpers (unchanged) ---------- */
  const handleForgotPassword = async (username: string) => {
    try {
      await authFns.resetPassword({ username });
      toast.success('Reset code sent!');
    } catch (err: any) { toast.error(err.message); throw err; }
  };

  const handleForgotPasswordSubmit = async (username: string, code: string, newPassword: string) => {
    try {
      await authFns.confirmResetPassword({ username, confirmationCode: code, newPassword });
      toast.success('Password reset—sign in again.');
      navigate('/login');
    } catch (err: any) { toast.error(err.message); throw err; }
  };

  const handleResendVerificationCode = async (username: string) => {
    try {
      await authFns.resendSignUpCode({ username });
      toast.success('Verification code resent!');
    } catch (err: any) { toast.error(err.message); throw err; }
  };

  /* ---------- PROVIDE CONTEXT ---------- */
  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      signIn: handleSignIn,
      signUp: handleSignUp,
      confirmMfa: handleConfirmMfa,
      signOut: handleSignOut,
      confirmSignUp: handleConfirmSignUp,
      forgotPassword: handleForgotPassword,
      forgotPasswordSubmit: handleForgotPasswordSubmit,
      resendVerificationCode: handleResendVerificationCode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ---------- HOOK ---------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
