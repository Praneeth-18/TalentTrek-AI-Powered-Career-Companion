import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useLocation, Navigate } from 'react-router-dom';
import QRCode from 'qrcode.react';

export function VerifyMFA() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const { verifyMFA, setupMFA } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const initMFA = async () => {
      try {
        const { qrCode, secret } = await setupMFA();
        setQrCodeData(qrCode);
        setSecret(secret);
      } catch (error) {
        console.error('Failed to setup MFA:', error);
      }
    };

    initMFA();
  }, [setupMFA]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyMFA(code);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!location.state?.user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Card className="w-[350px]">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Verify MFA</CardTitle>
        <CardDescription>
          Scan the QR code with your authenticator app and enter the code
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {qrCodeData && (
          <div className="flex justify-center mb-4">
            <QRCode value={qrCodeData} size={200} />
          </div>
        )}
        {secret && (
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Manual entry code:</p>
            <code className="bg-muted p-2 rounded">{secret}</code>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="code">Authentication Code</Label>
          <Input
            id="code"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
            maxLength={6}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={isLoading || !code}
        >
          {isLoading && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          Verify
        </Button>
      </CardFooter>
    </Card>
  );
} 