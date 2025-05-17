import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Icons } from '../../components/icons';
import { Link } from 'react-router-dom';

export function LoginForm() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(usernameOrEmail, password);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 p-4">
      <Card className="w-[400px] shadow-xl border-2 border-blue-100">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="w-full flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Icons.user className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to TalentTrek
          </CardTitle>
          <CardDescription className="text-lg">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="usernameOrEmail" className="text-base font-medium">Username or Email</Label>
        <Input
              id="usernameOrEmail"
              type="text"
              placeholder="Enter your username or email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              disabled={isLoading}
              className="h-11 text-base"
        />
      </div>
          <div className="grid gap-3">
            <Label htmlFor="password" className="text-base font-medium">Password</Label>
        <Input
              id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-11 text-base"
        />
      </div>
          <div className="flex items-center justify-end">
            <Link 
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Forgot password?
            </Link>
      </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-6">
          <Button 
            className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
            )}
        Sign In
      </Button>
          <div className="text-base text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}