import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Icons } from '../../components/icons';
import { Link } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<'interviewee' | 'interviewer'>('interviewee');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (username.includes('@')) {
      alert('Username cannot be in email format. Please use alphanumeric characters.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(username, email, password, firstName, lastName, userType);
    } catch (err) {
      console.error(err);
      alert('Sign-up failed, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-blue-100 p-4">
      <Card className="w-[450px] shadow-xl border-2 border-purple-100">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="w-full flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Icons.user className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Join TalentTrek
          </CardTitle>
          <CardDescription className="text-lg">
            Start your journey to excellence
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          {/* First / Last name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName}
                onChange={e => setFirstName(e.target.value)}
                disabled={isLoading} className="h-11" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName}
                onChange={e => setLastName(e.target.value)}
                disabled={isLoading} className="h-11" />
            </div>
          </div>

          {/* Username */}
          <div className="grid gap-3">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username (no email format)"
              disabled={isLoading} className="h-11" />
          </div>

          {/* Email / Password */}
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading} className="h-11" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading} className="h-11" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isLoading} className="h-11" />
          </div>

          {/* Role selection */}
          <div className="grid gap-3">
            <Label>I am a…</Label>
            <RadioGroup value={userType} onValueChange={val => setUserType(val as any)}
              className="grid grid-cols-2 gap-4">
              <RadioGroupItem value="interviewee" id="interviewee" className="peer sr-only" />
              <Label htmlFor="interviewee"
                className="flex flex-col items-center justify-between rounded-md border-2 p-4
                           hover:bg-accent peer-data-[state=checked]:border-purple-500 cursor-pointer">
                <Icons.user className="mb-2 h-6 w-6" />Interviewee
              </Label>

              <RadioGroupItem value="interviewer" id="interviewer" className="peer sr-only" />
              <Label htmlFor="interviewer"
                className="flex flex-col items-center justify-between rounded-md border-2 p-4
                           hover:bg-accent peer-data-[state=checked]:border-blue-500 cursor-pointer">
                <Icons.userTie className="mb-2 h-6 w-6" />Interviewer
              </Label>
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-6">
          <Button className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600"
            onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />}
            Create Account
          </Button>

          <div className="text-center text-muted-foreground">
            Already have an account?&nbsp;
            <Link to="/login" className="text-purple-600 hover:underline">Sign in</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
