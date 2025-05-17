'use client';

import { ApplicationsList } from '@/components/applications/ApplicationsList';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Suspense, useEffect, useState } from 'react';

// Define the shape of the API response
type ApplicationsResponse = {
  userId: string;
  applications: any[];
};

export default function ApplicationsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [applications, setApplications] = useState<ApplicationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchApplications() {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log(`Fetching applications for user ${user.id}`);
        
        const response = await fetch(`/api/applications?userId=${user.id}`);
        
        if (!response.ok) {
          if (response.status === 500) {
            console.error(`Server error ${response.status} fetching applications`);
            // Try to get more error details
            try {
              const errorData = await response.json();
              console.error('Error details:', errorData);
              setError(`Server error: ${errorData.error || 'Unknown error'}`);
            } catch (parseError) {
              console.error('Could not parse error response:', parseError);
            }
            
            // If there's a server error, just show an empty list
            setApplications({ userId: user.id, applications: [] });
            return;
          }
          
          const errorText = `Failed to fetch applications (${response.status})`;
          console.error(errorText);
          setError(errorText);
          throw new Error(errorText);
        }
        
        const data = await response.json();
        console.log('Applications data:', data); // For debugging
        
        // Check if the data has the expected structure
        if (!data || (data.applications && !Array.isArray(data.applications))) {
          console.error('Unexpected applications data format:', data);
          setError('The server returned data in an unexpected format');
          setApplications({ userId: user.id, applications: [] });
          return;
        }
        
        setApplications(data || { userId: user.id, applications: [] });
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications. Please try again later.');
        // Set applications to empty array to avoid showing other users' applications
        setApplications({ userId: user.id, applications: [] });
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated && !loading) {
      fetchApplications();
    }
  }, [user, isAuthenticated, loading]);

  if (loading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader 
          heading="My Applications"
          text="Track and manage your job applications"
        />
        <div className="text-center p-10 section-card">
          <div className="inline-block bg-accent/70 text-white px-4 py-2 rounded-ios font-medium">Loading applications...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <PageHeader 
          heading="My Applications"
          text="Track and manage your job applications"
        />
        <div className="text-center p-10 section-card">
          <div className="inline-block bg-red-500/70 text-white px-4 py-2 rounded-ios font-medium">{error}</div>
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="bg-accent/50 hover:bg-accent/70 transition-colors text-white px-4 py-2 rounded-ios font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const applicationsList = applications?.applications || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader 
        heading="My Applications"
        text="Track and manage your job applications"
      />
      {applicationsList.length === 0 ? (
        <div className="text-center p-10 section-card">
          <div className="inline-block bg-gray-500/70 text-white px-4 py-2 rounded-ios font-medium">
            You haven't applied to any jobs yet. Browse the job listings to get started!
          </div>
        </div>
      ) : (
        <ApplicationsList applications={applications} />
      )}
    </div>
  );
} 