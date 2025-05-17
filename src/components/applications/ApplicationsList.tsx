'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Building2, MapPin, Calendar, ChevronDown, Filter, ExternalLink, Check, Clock, X, Award } from 'lucide-react';

// Types updated to match the current database structure
type StatusHistory = {
  id: number;
  status: string;
  changed_at: string;
  notes?: string;
};

type ApplicationWithDetails = {
  application_id: number;
  user_id: string;
  job_listing_id: number;
  position_title: string;
  company: string;
  location?: string;
  job_category?: string;
  current_status: string;
  applied_at: string;
  updated_at: string;
  notes?: string;
  status_history: StatusHistory[];
  _forceUpdate?: number; // Add this field for forcing re-renders
};

interface ApplicationsListProps {
  applications: ApplicationWithDetails[] | any;
}

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Rejected', 'Offer Received'];

// Helper to get status icon based on status name
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Applied':
      return <Clock className="h-4 w-4" />;
    case 'Interviewing':
      return <Calendar className="h-4 w-4" />;
    case 'Rejected':
      return <X className="h-4 w-4" />;
    case 'Offer Received':
      return <Award className="h-4 w-4" />;
    default:
      return <Check className="h-4 w-4" />;
  }
};

export function ApplicationsList({ applications }: ApplicationsListProps) {
  const [expandedTimelines, setExpandedTimelines] = useState<Record<number, boolean>>({});
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });
  
  // Ensure applications is an array
  const applicationsArray = Array.isArray(applications) 
    ? applications 
    : (applications?.applications && Array.isArray(applications.applications) 
        ? applications.applications 
        : []);
  
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>(applicationsArray);
  // Add state to track status updates in progress
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({});
  // Add state to track locally updated statuses
  const [localStatusUpdates, setLocalStatusUpdates] = useState<Record<number, string>>({});
  // Add state to track locally updated status histories
  const [localStatusHistories, setLocalStatusHistories] = useState<Record<number, StatusHistory[]>>({});
  // Add a key to force re-render of specific cards
  const [cardKeys, setCardKeys] = useState<Record<number, number>>({});

  // Extract unique categories from job listings for all application categories
  const availableCategories = (() => {
    // Get categories from the applications
    const appCategories = new Set<string>();
    if (Array.isArray(applicationsArray)) {
      applicationsArray.forEach(app => {
        if (app.job_category) {
          appCategories.add(app.job_category);
        }
      });
    }
    
    return Array.from(appCategories).sort();
  })();

  // Calculate status counts
  const statusCounts = (() => {
    const counts: Record<string, number> = {};
    STATUS_OPTIONS.forEach(status => counts[status] = 0);
    
    if (Array.isArray(applicationsArray)) {
      applicationsArray.forEach(app => {
        // Use local status update if available
        const effectiveStatus = localStatusUpdates[app.application_id] || app.current_status;
        if (effectiveStatus) {
          counts[effectiveStatus] = (counts[effectiveStatus] || 0) + 1;
        }
      });
    }
    
    return counts;
  })();

  // Filter applications based on selected filters
  useEffect(() => {
    let result = [...applicationsArray];
    
    // Apply search filter first
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(app => 
        app.position_title.toLowerCase().includes(searchLower) || 
        app.company.toLowerCase().includes(searchLower) ||
        (app.job_category && app.job_category.toLowerCase().includes(searchLower)) ||
        (app.location && app.location.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.status) {
      result = result.filter(app => {
        // Check if we have a pending local update
        const localStatus = localStatusUpdates[app.application_id];
        return (localStatus || app.current_status) === filters.status;
      });
    }
    
    if (filters.category) {
      result = result.filter(app => app.job_category === filters.category);
    }
    
    // Apply any local status updates to the filtered applications
    result = result.map((app: ApplicationWithDetails) => {
      if (localStatusUpdates[app.application_id]) {
        return {
          ...app,
          current_status: localStatusUpdates[app.application_id],
          _forceUpdate: cardKeys[app.application_id] || Date.now()
        };
      }
      return app;
    });
    
    setFilteredApplications(result);
  }, [applicationsArray, filters, localStatusUpdates, cardKeys]);

  const toggleTimeline = (applicationId: number) => {
    setExpandedTimelines((prev) => ({
      ...prev,
      [applicationId]: !prev[applicationId],
    }));
  };

  // Create function to update status history for a specific application
  const updateLocalStatusHistory = (applicationId: number, newStatus: string) => {
    // Find the application to get its current status history
    const application = applicationsArray.find((app: ApplicationWithDetails) => app.application_id === applicationId);
    
    if (!application) return;
    
    // Create a new status history entry
    const newHistoryEntry: StatusHistory = {
      id: Date.now(), // Temporary ID for local state
      status: newStatus,
      changed_at: new Date().toISOString(),
      notes: `Status changed to ${newStatus}`
    };
    
    // Create updated status history with new entry at the top
    const updatedHistory = [
      newHistoryEntry,
      ...(application.status_history || [])
    ];
    
    // Update local state
    setLocalStatusHistories(prev => ({
      ...prev,
      [applicationId]: updatedHistory
    }));
    
    // Expand the timeline to show the new status
    setExpandedTimelines(prev => ({
      ...prev,
      [applicationId]: true
    }));
  };

  // Function to force refresh the page after status change
  const refreshPage = () => {
    window.location.reload();
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      // Make sure we're not already updating
      if (updatingStatus[applicationId]) {
        return;
      }
      
      // Update UI optimistically
      setUpdatingStatus(prev => ({ ...prev, [applicationId]: true }));
      
      // Track local status update - this is the key change
      setLocalStatusUpdates(prev => {
        const updatedStatuses = { ...prev, [applicationId]: newStatus };
        return updatedStatuses;
      });
      
      // Generate a new key for this card to force re-render
      setCardKeys(prev => ({
        ...prev,
        [applicationId]: Date.now()
      }));
      
      // Update local status history
      updateLocalStatusHistory(applicationId, newStatus);
      
      // Use the dedicated status update endpoint
      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          applicationId,
          newStatus,
          notes: `Status updated to ${newStatus}`
        }),
      });

      if (!response.ok) {
        console.error(`Failed to update status: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        
        // Revert the local status update on error
        setLocalStatusUpdates(prev => {
          const newState = { ...prev };
          delete newState[applicationId];
          return newState;
        });
        
        // Also revert the status history update
        setLocalStatusHistories(prev => {
          const newState = { ...prev };
          delete newState[applicationId];
          return newState;
        });
        
        throw new Error('Failed to update status');
      }

      // Get the updated application from the response
      const data = await response.json();
      console.log('Status update successful:', data);
      
      if (data.success && data.application) {
        // Find the application in the original array
        const appIndex = applicationsArray.findIndex((app: ApplicationWithDetails) => 
          app.application_id === applicationId
        );
        
        if (appIndex >= 0) {
          // Create a new copy of the applications array
          const updatedApps = [...applicationsArray];
          // Replace the updated application in the array
          updatedApps[appIndex] = data.application;
          
          // Update filtered applications to reflect the change
          setFilteredApplications(prev => {
            const prevFiltered = [...prev];
            const filteredIndex = prevFiltered.findIndex(app => app.application_id === applicationId);
            
            if (filteredIndex >= 0) {
              prevFiltered[filteredIndex] = data.application;
            }
            
            return prevFiltered;
          });
        }
        
        // Clear the local status update since we've received server confirmation
        setLocalStatusUpdates(prev => {
          const newState = { ...prev };
          delete newState[applicationId];
          return newState;
        });

        // Refresh the page to ensure all components reflect the new status
        // This is the simplest way to ensure consistent UI state
        setTimeout(refreshPage, 500);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update application status. Please try again.');
    } finally {
      // Always reset the updating status flag regardless of success or failure
      // This ensures the UI is responsive in all cases
      setUpdatingStatus(prev => {
        const newState = { ...prev };
        delete newState[applicationId];
        return newState;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Status counts */}
      <div className="section-card">
        <div className="grid grid-cols-5 gap-4">
          {STATUS_OPTIONS.map(status => (
            <div 
              key={status} 
              className={`flex flex-col items-center p-3 rounded-ios-lg backdrop-blur-xl w-full h-24 justify-center ${
                status === 'Interviewing' ? 'bg-blue-500/20' : 
                status === 'Rejected' ? 'bg-red-500/20' : 
                status === 'Offer Received' ? 'bg-green-500/20' : 
                'bg-gray-500/20'
              }`}
            >
              <div className="text-2xl font-bold text-white">{statusCounts[status] || 0}</div>
              <div className="text-sm text-white/80">{status}</div>
            </div>
          ))}
          <div className="flex flex-col items-center p-3 rounded-ios-lg backdrop-blur-xl bg-orange-500/20 w-full h-24 justify-center">
            <div className="text-2xl font-bold text-white">{applicationsArray.length}</div>
            <div className="text-sm text-white/80">Total</div>
          </div>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="section-card">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-white mb-1">Filter by Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-ios-lg px-3 py-2 text-sm font-medium text-white bg-card border-none backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          
          {availableCategories.length > 0 && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-white mb-1">Filter by Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-ios-lg px-3 py-2 text-sm font-medium text-white bg-card border-none backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex flex-col">
            <label className="text-sm font-medium text-white mb-1">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Job title, company..."
                className="w-full rounded-ios-lg px-3 py-2 text-sm text-white bg-card border-none backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-accent"
              />
              
              <button 
                onClick={() => setFilters({ status: '', category: '', search: '' })}
                className="rounded-ios-lg bg-card border-none backdrop-blur-xl px-4 py-2 text-sm font-medium text-white hover:bg-accent/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active filters display */}
      {(filters.status || filters.category || filters.search) && (
        <div className="flex items-center gap-2 text-sm text-white section-card py-3">
          <Filter className="h-4 w-4" />
          <span>Showing: </span>
          {filters.status && <span className="font-medium">{filters.status}</span>}
          {filters.status && (filters.category || filters.search) && <span> + </span>}
          {filters.category && <span className="font-medium">{filters.category}</span>}
          {filters.category && filters.search && <span> + </span>}
          {filters.search && <span className="font-medium">"{filters.search}"</span>}
          <span> ({filteredApplications.length} applications)</span>
        </div>
      )}

      {/* Applications list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredApplications.map((application) => {
          // Get effective current status (considering local updates)
          const currentStatus = localStatusUpdates[application.application_id] || application.current_status;
          
          // Determine direct background color for immediate style application
          const getDirectBackgroundColor = () => {
            switch(currentStatus) {
              case 'Interviewing':
                return 'linear-gradient(135deg, rgba(96, 165, 250, 0.4), rgba(59, 130, 246, 0.3))';
              case 'Rejected':
                return 'linear-gradient(135deg, rgba(248, 113, 113, 0.4), rgba(239, 68, 68, 0.3))';
              case 'Offer Received':
                return 'linear-gradient(135deg, rgba(74, 222, 128, 0.4), rgba(34, 197, 94, 0.3))';
              default: // Applied
                return 'linear-gradient(135deg, rgba(156, 163, 175, 0.4), rgba(107, 114, 128, 0.3))';
            }
          };
          
          // Generate a unique key that changes when status changes
          const uniqueKey = `app-${application.application_id}-${currentStatus}-${cardKeys[application.application_id] || application._forceUpdate || Date.now()}`;
          
          return (
            <div
              key={uniqueKey}
              className={`rounded-ios-lg bg-card backdrop-blur-xl p-5 shadow-lg 
                          hover:shadow-xl hover:translate-y-[-8px] 
                          transition-transform duration-300 ease-in-out`}
              style={{ 
                background: getDirectBackgroundColor(),
                transition: "all 0.3s ease-in-out" 
              }}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {application.position_title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-white">
                      <Building2 className="h-4 w-4" />
                      <span>{application.company}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {application.job_category && (
                        <span className="inline-block bg-layer backdrop-blur-xl rounded-ios px-3 py-1 text-xs font-medium text-white">
                          {application.job_category}
                        </span>
                      )}
                      
                      {/* Status badge with direct style application */}
                      <span 
                        key={`badge-${application.application_id}-${currentStatus}-${Date.now()}`}
                        className={`inline-block backdrop-blur-xl px-3 py-1 text-xs font-medium rounded-ios text-white`}
                        style={{
                          backgroundColor: currentStatus === 'Interviewing' ? 'rgba(59, 130, 246, 0.7)' : 
                                          currentStatus === 'Rejected' ? 'rgba(239, 68, 68, 0.7)' :
                                          currentStatus === 'Offer Received' ? 'rgba(34, 197, 94, 0.7)' :
                                          'rgba(107, 114, 128, 0.7)'
                        }}
                      >
                        {currentStatus}
                        {updatingStatus[application.application_id] && 
                          <span className="ml-1 inline-block animate-pulse">...</span>
                        }
                      </span>
                    </div>
                  </div>
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(application.application_id, e.target.value)}
                    disabled={updatingStatus[application.application_id]}
                    className={`rounded-ios-lg bg-layer backdrop-blur-xl px-3 py-2 text-sm font-medium text-white 
                              ${updatingStatus[application.application_id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-card cursor-pointer'} 
                              transition-all`}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  {application.location && (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <MapPin className="h-4 w-4" />
                      <span>{application.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Calendar className="h-4 w-4" />
                    <span>Applied: {format(new Date(application.applied_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {application.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-white">Notes:</h4>
                    <p className="text-sm text-white/90 mt-1">{application.notes}</p>
                  </div>
                )}

                {/* Status History Dropdown */}
                <div>
                  <button
                    onClick={() => toggleTimeline(application.application_id)}
                    className="flex items-center justify-between w-full bg-layer backdrop-blur-xl px-3 py-2 rounded-ios text-sm text-white hover:bg-card transition-all"
                  >
                    <span>Status History</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        expandedTimelines[application.application_id] ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {expandedTimelines[application.application_id] && (
                    <div className="mt-4 relative pl-4 before:content-[''] before:absolute before:left-2 before:top-0 before:h-full before:w-px before:bg-white/20">
                      {/* Use local status history if available, otherwise use the original */}
                      {(localStatusHistories[application.application_id] || application.status_history)?.length > 0 ? (
                        (localStatusHistories[application.application_id] || application.status_history).map((history, index) => {
                          // Determine the status color
                          const getStatusColor = () => {
                            switch(history.status) {
                              case 'Interviewing': return 'border-blue-400 bg-blue-500/10';
                              case 'Rejected': return 'border-red-400 bg-red-500/10';
                              case 'Offer Received': return 'border-green-400 bg-green-500/10';
                              default: return 'border-gray-400 bg-gray-500/10';
                            }
                          };
                          
                          // Determine status icon
                          const getStatusIcon = () => {
                            switch(history.status) {
                              case 'Interviewing': return <Clock className="h-4 w-4 text-blue-300" />;
                              case 'Rejected': return <X className="h-4 w-4 text-red-300" />;
                              case 'Offer Received': return <Award className="h-4 w-4 text-green-300" />;
                              default: return <Check className="h-4 w-4 text-gray-300" />;
                            }
                          };
                          
                          // Determine if this is the latest status
                          const isLatestStatus = index === 0;
                          
                          return (
                            <div key={index} className="mb-3 last:mb-0 flex items-start gap-3">
                              <div className="mt-1 flex-shrink-0 h-2 w-2 rounded-full bg-white"></div>
                              <div className={`flex-grow border-l-2 px-3 py-2 rounded-r-md ${getStatusColor()}`}>
                                <div className="flex justify-between items-center gap-2">
                                  <div className="flex items-center gap-1.5">
                                    {getStatusIcon()}
                                    <span className="font-medium text-sm text-white">
                                      {history.status}
                                      {isLatestStatus && <span className="ml-2 text-xs bg-accent/30 py-0.5 px-2 rounded-full">Latest</span>}
                                    </span>
                                  </div>
                                  <span className="text-xs bg-layer/60 rounded-full py-1 px-2 text-white/70 ml-2 whitespace-nowrap">
                                    {format(new Date(history.changed_at), 'MMM d, yyyy')}
                                  </span>
                                </div>
                                {history.notes && (
                                  <p className="text-white/80 text-xs mt-1">{history.notes}</p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-white/50 py-3 px-4 bg-layer/30 rounded-md">No status changes yet</div>
                      )}
                    </div>
                  )}
                </div>

                {/* View Job Details button */}
                <button
                  onClick={() => window.open(`/api/applications/redirect?jobId=${application.job_listing_id}`, '_blank')}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-ios text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-all backdrop-blur-xl border border-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Job Details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Empty state */}
      {filteredApplications.length === 0 && (
        <div className="section-card flex flex-col items-center justify-center text-center p-10">
          <div className="w-16 h-16 bg-gray-700/60 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white">No applications found</h3>
          <p className="text-white/80 mt-2">Try adjusting your filters or apply for more jobs</p>
        </div>
      )}
    </div>
  );
} 
