import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Icons } from '../../components/icons';
import { useLocation, Navigate } from 'react-router-dom';

export function VerifyEmail() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { confirmSignUp, resendVerificationCode } = useAuth();
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await confirmSignUp(email, code);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerificationCode(email);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Verify your email</CardTitle>
        <CardDescription>
          We've sent a verification code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          Verify Email
        </Button>
        <Button 
          variant="link" 
          className="w-full"
          onClick={handleResend}
          disabled={isLoading}
        >
          Resend verification code
        </Button>
      </CardFooter>
    </Card>
  );
} 