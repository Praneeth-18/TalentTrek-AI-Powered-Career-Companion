'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'border-accent' 
}: LoadingSpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClass[size]} ${color} rounded-full border-t-transparent animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export function LoadingJobCard() {
  return (
    <div className="job-card animate-pulse">
      <div className="h-6 bg-gray-300/30 rounded-full w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-300/30 rounded-full w-1/4 mb-2"></div>
      <div className="h-4 bg-gray-300/30 rounded-full w-1/2 mb-4"></div>
      <div className="space-y-2 mt-4">
        <div className="h-4 bg-gray-300/30 rounded-full w-3/4"></div>
        <div className="h-4 bg-gray-300/30 rounded-full w-1/2"></div>
      </div>
      <div className="flex gap-2 mt-8">
        <div className="h-8 bg-gray-300/30 rounded-ios w-1/2"></div>
        <div className="h-8 bg-accent/30 rounded-ios w-1/2"></div>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 9 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <LoadingJobCard key={i} />
      ))}
    </div>
  );
} 