'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Briefcase, 
  FileText,
  LogOut,
  MessageSquare,
  History,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewPanel } from '../interviewer/InterviewPanel';
import { InterviewHistory } from '../interviewer/InterviewHistory';
import { interviewApi } from '../interviewer/api';
import { InterviewType, Interview, ChatMessage } from '../interviewer/types';
import { InterviewForm } from '../interviewer/InterviewForm';

const navigation = [
  { name: 'Job Listings', href: '/dashboard', icon: Home },
  { name: 'My Applications', href: '/applications', icon: Briefcase },
  { name: 'Resume Customization', href: '/resume', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [showInterviewPanel, setShowInterviewPanel] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isInterviewerExpanded, setIsInterviewerExpanded] = useState(false);
  
  interface InterviewData {
    interview: Interview | null;
    interviewId: string;
    messages?: ChatMessage[];
  }
  
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleNewInterview = () => {
    setShowInterviewForm(true);
    setIsInterviewerExpanded(false);
  };
  
  const handleFormSubmit = async (formData: {
    title: string;
    company: string;
    candidateName: string;
    jobType: string;
    type: InterviewType;
  }) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Create interview data based on form input
      const newInterview = {
        title: formData.title,
        job_type: formData.jobType,
        candidate_name: formData.candidateName,
        company: formData.company,
        type: formData.type
      };
      
      // Create the interview
      const createResponse = await interviewApi.createInterview(newInterview);
      
      // After creating the interview, get full interview details
      if (createResponse && createResponse.interviewId) {
        const interviewDetails = await interviewApi.getInterview(createResponse.interviewId);
        const chatHistory = await interviewApi.getChatHistory(createResponse.interviewId);
        
        setInterviewData({
          interview: interviewDetails,
          interviewId: createResponse.interviewId,
          messages: chatHistory || []
        });
        
        setShowInterviewPanel(true);
        setShowInterviewForm(false);
      }
    } catch (err) {
      console.error('Failed to create interview:', err);
      setError('Failed to create interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleHistory = async () => {
    setShowHistory(true);
    setIsInterviewerExpanded(false);
  };
  
  const handleClosePanel = () => {
    setShowInterviewPanel(false);
    setInterviewData(null);
  };
  
  const handleCloseForm = () => {
    setShowInterviewForm(false);
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <div className="flex h-full w-64 flex-col bg-black/40 backdrop-blur-xl z-10">
        <div className="flex h-16 shrink-0 items-center px-6">
          <h1 className="text-2xl font-bold text-white">TalentTrek Jobs</h1>
        </div>
        
        {/* User information section */}
        {user && (
          <div className="px-6 py-4 flex items-center text-white/90 border-b border-white/10">
            <User className="h-5 w-5 mr-2" />
            <div className="truncate">
              <p className="text-sm font-medium">Signed in as:</p>
              <p className="text-sm font-bold truncate">{user.name || user.email}</p>
            </div>
          </div>
        )}
        
        <nav className="flex flex-1 flex-col px-4 py-4">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? 'bg-white/20 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10',
                        'group flex gap-x-3 rounded-ios p-2 text-sm font-semibold leading-6 transition-all duration-200'
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-6 w-6 shrink-0",
                          pathname === item.href
                            ? 'text-primary'
                            : 'text-white/70 group-hover:text-white'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
                <li className="mt-2">
                  <button
                    onClick={() => setIsInterviewerExpanded(!isInterviewerExpanded)}
                    className={`group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 
                      ${isInterviewerExpanded ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                  >
                    <MessageSquare
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    Mock Interviewer
                  </button>
                  
                  {isInterviewerExpanded && (
                    <div className="ml-8 mt-2 space-y-1">
                      <button
                        onClick={handleNewInterview}
                        className={`group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 
                          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        disabled={isLoading}
                      >
                        <MessageSquare
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        {isLoading ? 'Starting...' : 'New Interview'}
                      </button>
                      <button
                        onClick={handleHistory}
                        className="group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:text-white hover:bg-gray-800"
                      >
                        <History
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        Interview History
                      </button>
                    </div>
                  )}
                </li>
                {/* Sign out button as a list item right after the navigation items */}
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left group flex gap-x-3 rounded-ios p-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <LogOut
                      className="h-6 w-6 shrink-0 text-white/70 group-hover:text-white"
                      aria-hidden="true"
                    />
                    Sign Out
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
      
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-md shadow-lg">
          {error}
          <button 
            className="ml-2 font-bold" 
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}
      
      {showInterviewPanel && interviewData && (
        <InterviewPanel 
          onClose={handleClosePanel} 
          interviewData={interviewData}
        />
      )}
      
      {showInterviewForm && (
        <InterviewForm 
          onSubmit={handleFormSubmit} 
          onClose={handleCloseForm} 
        />
      )}
      
      {showHistory && (
        <InterviewHistory onClose={() => setShowHistory(false)} />
      )}
    </>
  );
}