'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Building2, MapPin, Calendar, ExternalLink, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { JobListingType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface JobListingCardProps {
  job: JobListingType;
  cachedInteractions?: any[];
}

export function JobListingCard({ job, cachedInteractions }: JobListingCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAppliedPrompt, setShowAppliedPrompt] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
  const { user } = useAuth();
  const [hasRecordedView, setHasRecordedView] = useState(false);

  // Complete replacement for useEffect and focus handling
  useEffect(() => {
    // Just set browser state
    setIsBrowser(true);
    
    // Reset state when user changes
    if (!user?.id) {
      setHasApplied(false);
      return;
    }
    
    // Only check for applied state from cached data
    if (cachedInteractions && cachedInteractions.length > 0) {
      const hasAppliedInteraction = cachedInteractions.some(
        interaction => interaction.interaction_type === 'applied'
      );
      
      if (hasAppliedInteraction) {
        setHasApplied(true);
      } else {
        setHasApplied(false);
      }
    } else {
      setHasApplied(false);
    }
    
    // No focus listeners as they cause excessive popups
  }, [cachedInteractions, user?.id]);

  // Replace the applyToJob function with a more efficient version
  function applyToJob() {
    const applicationLink = job.actualApplyLink || job.applyLink;
    
    if (!applicationLink || !user?.id) return;
    
    // Just open the application link in a new tab
    window.open(applicationLink, '_blank');
    
    // Show the confirmation dialog only ONCE
    if (!showAppliedPrompt && !hasApplied) {
      // Set a flag in localStorage to prevent showing this dialog repeatedly
      try {
        const viewedLinksKey = `viewed_links_${user.id}`;
        const viewedLinks = JSON.parse(localStorage.getItem(viewedLinksKey) || '{}');
        
        // Only show the prompt if haven't shown it for this job before
        if (!viewedLinks[job.id]) {
          setShowAppliedPrompt(true);
          
          // Mark this job link as viewed to avoid repeated prompts
          viewedLinks[job.id] = new Date().toISOString();
          localStorage.setItem(viewedLinksKey, JSON.stringify(viewedLinks));
        }
      } catch (e) {
        // If localStorage fails, still show the prompt once
        setShowAppliedPrompt(true);
      }
    }
  }

  const handleConfirmApplication = async () => {
    if (!user?.id || hasApplied) return;
    
    // Optimistically update the UI immediately
    setHasApplied(true);
    setShowAppliedPrompt(false);
    setIsSubmitting(true);
    
    // Clear any existing localStorage data for other users to prevent contamination
    try {
      // Clean up any non-prefixed keys (from older versions)
      if (localStorage.getItem('applied_jobs')) {
        localStorage.removeItem('applied_jobs');
      }
      
      // Only update the user-specific key
      const appliedJobsKey = `applied_jobs_${user.id}`;
      const appliedJobs = JSON.parse(localStorage.getItem(appliedJobsKey) || '{}');
      appliedJobs[job.id] = new Date().toISOString();
      localStorage.setItem(appliedJobsKey, JSON.stringify(appliedJobs));
      
      // Also dispatch a custom event to notify other components
      const applicationEvent = new CustomEvent('job-application-saved', { 
        detail: { jobId: job.id, userId: user.id }
      });
      window.dispatchEvent(applicationEvent);
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
    
    try {
      // Define a function to make the API request with retries
      const recordApplication = async (endpoint: string, maxRetries = 2) => {
        let retries = 0;
        let lastError = null;
        
        // Prepare application data
        const applicationData = {
          jobListingId: job.id,
          userId: user.id,
          recordInteraction: true
        };
        
        while (retries <= maxRetries) {
          try {
            console.log(`Attempt ${retries + 1} to record application with endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(applicationData),
            });
            
            // If successful or already applied (409), return the response
            if (response.ok || response.status === 409) {
              return { success: true, response };
            }
            
            // For other errors, throw to retry
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
          } catch (error) {
            lastError = error;
            retries++;
            
            // Wait a bit before retrying (exponential backoff)
            if (retries <= maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retries - 1), 5000);
              console.log(`Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // All retries failed
        return { success: false, error: lastError };
      };
      
      // Try the main endpoint first (in background)
      console.log(`Recording application for job ${job.id} and user ${user.id}`);
      recordApplication('/api/applications').then(result => {
        if (!result.success) {
          // If the main endpoint failed, try the fallback endpoint
          console.log('Main endpoint failed, trying fallback endpoint...');
          recordApplication('/api/save-application').then(fallbackResult => {
            if (!fallbackResult.success) {
              console.error('All application recording attempts failed:', fallbackResult.error);
            } else if (fallbackResult.response) {
              console.log('Application recorded successfully via fallback');
            }
          });
        } else if (result.response) {
          console.log('Application recorded successfully');
        }
      }).finally(() => {
        setIsSubmitting(false);
      });
    } catch (error) {
      console.error('Unexpected error recording application:', error);
      // Don't alert as we're using optimistic UI update
      setIsSubmitting(false);
    }
  };

  const formatSalary = (salary: string | null | undefined) => {
    if (!salary) return 'Salary not specified';
    return salary;
  };

  const formatDate = (date: Date) => {
    try {
      const dateObj = new Date(date);
      return format(dateObj, 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatQualifications = (qualifications: string | null | undefined) => {
    if (!qualifications) return 'No qualifications specified';
    
    // Split by newlines or numbered lists (e.g. "1. ", "2. ")
    const items = qualifications.split(/\r?\n|(?=\d+\.\s)/);
    
    return (
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, index) => {
          const trimmed = item.trim();
          if (!trimmed) return null;
          // Remove the number at the beginning if it exists
          const cleanItem = trimmed.replace(/^\d+\.\s+/, '');
          return <li key={index}>{cleanItem}</li>;
        })}
      </ul>
    );
  };

  // Determine card colors based on job category for Glassmorphism style
  const getCategoryColors = () => {
    const category = job.jobCategory?.toLowerCase() || '';
    
    // Glassmorphism-inspired color combinations with transparency
    if (category.includes('software') || category.includes('engineer')) {
      return { bg: 'from-blue-400/20 to-blue-500/10', text: 'text-gray-800', accent: 'bg-blue-500/60' };
    } else if (category.includes('data')) {
      return { bg: 'from-purple-400/20 to-purple-500/10', text: 'text-gray-800', accent: 'bg-purple-500/60' };
    } else if (category.includes('product') || category.includes('manager')) {
      return { bg: 'from-amber-400/20 to-amber-500/10', text: 'text-gray-800', accent: 'bg-amber-500/60' };
    } else if (category.includes('design') || category.includes('ui')) {
      return { bg: 'from-pink-400/20 to-pink-500/10', text: 'text-gray-800', accent: 'bg-pink-500/60' };
    } else {
      return { bg: 'from-gray-400/20 to-gray-500/10', text: 'text-gray-800', accent: 'bg-gray-500/60' };
    }
  };
  
  const colors = getCategoryColors();

  // Only render client-side content if we're in the browser
  if (!isBrowser) {
    return (
      <div className="glassmorphism p-5 h-64">
        <div className="space-y-2 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-white">
                {job.positionTitle}
              </h3>
            </div>
            <div className="mt-2">
              {job.jobCategory && (
                <Badge variant="glass">
                  {job.jobCategory}
                </Badge>
              )}
              {job.h1bSponsored && (
                <Badge variant="glass" className="badge-h1b ml-1">
                  H1B
                </Badge>
              )}
              {job.isNewGrad && (
                <Badge variant="glass" className="badge-newgrad ml-1">
                  New Grad
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-white">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If the user has already applied, show a different styled card
  if (hasApplied) {
    console.log(`Rendering applied card for job ${job.id}`);
    return (
      <div className="job-card hover:transform hover:translate-y-[-4px] transition-all duration-300 bg-green-500/40 rounded-ios-lg">
        <div className="space-y-2 h-full flex flex-col">
          <div className="flex flex-col gap-2 flex-grow">
            <div className="absolute top-2 right-2">
              <Badge variant="success" className="rounded-ios">
                <CheckCircle className="h-3 w-3 mr-1" /> Applied
              </Badge>
            </div>
            <h3 className="text-lg font-medium pr-20 line-clamp-2 text-white">
              {job.positionTitle}
            </h3>
            <div className="flex flex-wrap gap-1">
              {job.jobCategory && (
                <Badge variant="glass" className="rounded-ios">
                  {job.jobCategory}
                </Badge>
              )}
              {job.h1bSponsored && (
                <Badge variant="glass" className="badge-h1b rounded-ios">
                  H1B
                </Badge>
              )}
              {job.isNewGrad && (
                <Badge variant="glass" className="badge-newgrad rounded-ios">
                  New Grad
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-white">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{job.company}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-white">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-auto">
            <Button
              variant="glass"
              className="flex-1 min-w-0 flex items-center justify-center btn-secondary rounded-ios"
              onClick={() => window.location.href = '/applications'}
            >
              View Application
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-0 flex items-center justify-center gap-1 btn-secondary rounded-ios"
              onClick={() => {
                const link = job.actualApplyLink || job.applyLink;
                if (link) window.open(link, '_blank');
              }}
            >
              <span>View Job Details</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`job-card hover:transform hover:translate-y-[-4px] transition-all duration-300 rounded-ios-lg ${hasApplied ? 'bg-green-500/40' : ''}`}>
        <div className="space-y-3 h-full flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-white line-clamp-2 tracking-tight">
              {job.positionTitle}
            </h3>
            <div className="flex flex-wrap gap-1">
              {job.jobCategory && (
                <Badge variant="glass" className="rounded-ios">
                  {job.jobCategory}
                </Badge>
              )}
              {job.h1bSponsored && (
                <Badge variant="glass" className="badge-h1b rounded-ios">
                  H1B
                </Badge>
              )}
              {job.isNewGrad && (
                <Badge variant="glass" className="badge-newgrad rounded-ios">
                  New Grad
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-white">
              <Building2 className="h-4 w-4 text-accent" />
              <span className="font-medium">{job.company}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <MapPin className="h-4 w-4 text-accent/80" />
                <span>{job.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Calendar className="h-4 w-4 text-accent/80" />
              <span>Posted: {formatDate(job.postingDate)}</span>
            </div>
            {job.salary && (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <DollarSign className="h-4 w-4 text-accent/80" />
                <span>{formatSalary(job.salary)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="glass" className="btn-details rounded-ios">
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-ios-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-medium">
                    {job.positionTitle}
                  </DialogTitle>
                  <DialogDescription>
                    <div className="flex flex-wrap gap-2 my-2">
                      {job.jobCategory && (
                        <Badge variant="glass">
                          {job.jobCategory}
                        </Badge>
                      )}
                      {job.h1bSponsored && (
                        <Badge variant="glass" className="badge-h1b">
                          H1B Sponsored
                        </Badge>
                      )}
                      {job.isNewGrad && (
                        <Badge variant="glass" className="badge-newgrad">
                          New Grad
                        </Badge>
                      )}
                      {job.workModel && (
                        <Badge variant="glass">
                          {job.workModel}
                        </Badge>
                      )}
                    </div>
                  </DialogDescription>
                  <div className="mt-2">
                    <div className="text-lg font-medium text-white">{job.company}</div>
                    {job.location && <div className="text-white">{job.location}</div>}
                  </div>
                </DialogHeader>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-white border-b border-white/20 pb-1">About This Role</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-white" />
                        <span className="text-white">Posted: {formatDate(job.postingDate)}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-white" />
                          <span className="text-white">{formatSalary(job.salary)}</span>
                        </div>
                      )}
                      {job.companySize && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-white" />
                          <span className="text-white">Company Size: {job.companySize}</span>
                        </div>
                      )}
                      {job.companyIndustry && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-white" />
                          <span className="text-white">Industry: {job.companyIndustry}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {job.qualifications && (
                    <div>
                      <h4 className="text-md font-medium text-white border-b border-white/20 pb-1">Requirements/Qualifications</h4>
                      <div className="mt-2 text-sm text-white">
                        {formatQualifications(job.qualifications)}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 flex gap-2">
                    <Button
                      onClick={applyToJob}
                      className="w-full btn-apply"
                    >
                      Apply Now <ExternalLink className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={applyToJob}
              variant="default"
              className="btn-apply rounded-ios font-medium tracking-tight"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Apply Confirmation Dialog - Show after user returns from applying */}
      {showAppliedPrompt && (
        <Dialog open={showAppliedPrompt} onOpenChange={(open) => {
          if (!open) {
            setShowAppliedPrompt(false);
          }
        }}>
          <DialogContent className="max-w-md p-4 rounded-ios-lg">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-lg font-medium text-center">Applied to this job?</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center gap-3 mt-2">
              <Button 
                onClick={() => {
                  // Record application and close dialog
                  handleConfirmApplication();
                  setShowAppliedPrompt(false);
                }}
                className="btn-success px-4 py-2"
                size="sm"
              >
                Yes
              </Button>
              <Button
                onClick={() => {
                  // Just close without recording
                  setShowAppliedPrompt(false);
                }}
                variant="outline"
                size="sm"
                className="px-4 py-2"
              >
                No
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 