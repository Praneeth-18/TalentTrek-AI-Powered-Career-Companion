import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function IntervieweeDashboard() {
  const { signOut, user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, Interviewee!</h1>
      <p className="text-muted-foreground mb-4">
        Email: {user?.email}
      </p>
      <Button onClick={signOut}>Sign Out</Button>
    </div>
  );
} 