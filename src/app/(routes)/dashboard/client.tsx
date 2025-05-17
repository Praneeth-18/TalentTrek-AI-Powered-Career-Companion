'use client';

import { useState, useEffect } from 'react';
import { JobListings } from '@/components/job-listings/JobListings';
import { LoadingGrid } from '@/components/ui/loading-spinner';

// Types
type CategoryStats = {
  category: string;
  count: number;
  totalPages: number;
};

interface ClientProps {
  initialJobs: any[];
  totalPages: number;
  currentPage: number;
  allCategories: string[];
  selectedCategory: string;
  categoryStats: CategoryStats[];
}

export default function JobListingsClient({ 
  initialJobs, 
  totalPages, 
  currentPage, 
  allCategories,
  selectedCategory,
  categoryStats 
}: ClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Show skeleton loading state when switching categories/pages
  useEffect(() => {
    const handleRouteChange = () => {
      setIsLoading(true);
    };
    
    // Add listeners for route changes
    window.addEventListener('beforeunload', handleRouteChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleRouteChange);
    };
  }, []);
  
  if (isLoading) {
    return <LoadingGrid count={12} />;
  }
  
  return (
    <JobListings 
      jobs={initialJobs} 
      totalPages={totalPages} 
      currentPage={currentPage} 
      allCategories={allCategories}
      selectedCategory={selectedCategory}
      categoryStats={categoryStats}
    />
  );
} 