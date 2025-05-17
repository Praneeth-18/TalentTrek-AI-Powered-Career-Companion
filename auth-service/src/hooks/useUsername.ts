import { useState, useEffect } from "react";
import { getCurrentUser } from '@aws-amplify/auth';

export function useUsername() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      setLoading(true);
      try {
        const cognitoUser = await getCurrentUser();
        setUsername(cognitoUser.username);
        setError(null);
      } catch (err) {
        console.error("Error fetching username:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsername();
  }, []);

  return { username, loading, error };
} 