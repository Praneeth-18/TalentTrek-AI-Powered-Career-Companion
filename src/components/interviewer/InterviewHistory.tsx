import React, { useState, useEffect } from 'react';
import { X, Calendar, Star, Clock, RefreshCw, BarChart, User } from 'lucide-react';
import { interviewApi } from './api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Define the interface for streamlined interview data
interface StreamlinedInterview {
  interviewId: string;
  title: string;
  score: number | null;
  feedback: string | null;
  created_at: string;
}

interface InterviewHistoryProps {
  onClose: () => void;
}

interface GraphViewData {
  date: number; // timestamp for sorting
  displayDate: string; // formatted date for display
  score: number;
  title: string; // For tooltip
}

export const InterviewHistory: React.FC<InterviewHistoryProps> = ({ onClose }) => {
  const { user } = useAuth(); // Get current user
  const username = user?.name || user?.email || '';
  
  const [interviews, setInterviews] = useState<StreamlinedInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<StreamlinedInterview | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [graphData, setGraphData] = useState<GraphViewData[]>([]);

  // Use effect with username dependency
  useEffect(() => {
    if (username) {
      fetchInterviews();
    }
  }, [username]);

  // Prepare graph data whenever interviews change
  useEffect(() => {
    if (interviews.length > 0) {
      const data = interviews
        .filter(interview => interview.score !== undefined && interview.score !== null)
        .map(interview => {
          const date = new Date(interview.created_at);
          return {
            date: date.getTime(), // timestamp for sorting
            displayDate: formatDateShort(date),
            score: interview.score || 0,
            title: interview.title
          };
        })
        .sort((a, b) => a.date - b.date); // Sort by date ascending
      
      setGraphData(data);
    }
  }, [interviews]);

  const fetchInterviews = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Always fetch interviews for the current user
      const data = await interviewApi.getInterviewsByUser(username);
      
      if (data && Array.isArray(data)) {
        // Sort by date (newest first) for list view
        const sortedData = [...data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setInterviews(sortedData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      setError('Failed to load interview history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewInterview = (interview: StreamlinedInterview) => {
    setSelectedInterview(interview);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'graph' : 'list');
  };

  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 p-3 rounded border border-white/10 shadow-lg">
          <p className="text-white font-medium">{payload[0].payload.title}</p>
          <p className="text-purple-300">{payload[0].payload.displayDate}</p>
          <p className="text-white">Score: <span className="font-bold">{payload[0].value}/10</span></p>
        </div>
      );
    }
    return null;
  };

  const renderGraph = () => {
    if (graphData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white text-opacity-80">
          <p className="mb-3">No scored interviews available for graph view.</p>
          <button
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
            onClick={() => setViewMode('list')}
          >
            Switch to List View
          </button>
        </div>
      );
    }

    return (
      <div className="h-full p-4 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">
          Your Interview Performance History
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={graphData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="displayDate" 
              stroke="rgba(255,255,255,0.5)"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              label={{ 
                value: 'Date', 
                position: 'insideBottomRight',
                offset: -10,
                fill: 'rgba(255,255,255,0.7)'
              }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)" 
              domain={[0, 10]}
              tick={{ fill: 'rgba(255,255,255,0.7)' }}
              label={{ 
                value: 'Score (out of 10)', 
                angle: -90, 
                position: 'insideLeft',
                fill: 'rgba(255,255,255,0.7)'
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8b5cf6"
              strokeWidth={2}
              activeDot={{ r: 8, fill: '#d8b4fe' }}
              name="Interview Score"
              isAnimationActive={true}
              animationDuration={1000}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-md">
      <div className="w-2/3 h-2/3 bg-white bg-opacity-10 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            My Interview History
          </h2>
          <div className="flex space-x-2">
            <button
              className="rounded-lg p-2 bg-white/10 hover:bg-white/20 transition-colors text-white flex items-center"
              onClick={toggleViewMode}
              title={viewMode === 'list' ? 'Switch to Graph View' : 'Switch to List View'}
            >
              {viewMode === 'list' ? <BarChart size={18} /> : <Calendar size={18} />}
            </button>
            <button
              className="rounded-lg p-2 bg-white/10 hover:bg-white/20 transition-colors text-white flex items-center"
              onClick={() => fetchInterviews()}
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              className="rounded-lg p-2 bg-white/10 hover:bg-white/20 transition-colors text-white"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Username display */}
        <div className="mb-4 flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/10">
          <User size={16} className="text-white/70" />
          <span className="text-white">Viewing interviews for: <span className="font-medium">{username}</span></span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 text-red-100 rounded-md">
            {error}
            <button 
              className="ml-2 font-bold" 
              onClick={() => setError('')}
            >
              ✕
            </button>
          </div>
        )}

        {selectedInterview ? (
          <div className="h-5/6 overflow-y-auto">
            <button
              className="mb-4 px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors text-white rounded-md flex items-center"
              onClick={() => setSelectedInterview(null)}
            >
              ← Back to list
            </button>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">
                {selectedInterview.title}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-white/70 text-sm">Interview ID</p>
                  <p className="text-white">{selectedInterview.interviewId}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Date</p>
                  <p className="text-white">{formatDate(selectedInterview.created_at)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Score</p>
                  <p className="text-white">{selectedInterview.score ? `${selectedInterview.score}/10` : 'N/A'}</p>
                </div>
              </div>
              
              {selectedInterview.feedback && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">Feedback</h4>
                  <div className="bg-white/5 p-3 rounded border border-white/10 text-white">
                    {selectedInterview.feedback}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-white rounded-lg transition-colors"
                  onClick={() => window.location.href = `/interviews/${selectedInterview.interviewId}`}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-5/6 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
              </div>
            ) : viewMode === 'graph' ? (
              renderGraph()
            ) : interviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white text-opacity-80">
                <p className="mb-3">No interview history found.</p>
                <button
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                  onClick={onClose}
                >
                  Start a New Interview
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {interviews.map((interview) => (
                  <div 
                    key={interview.interviewId}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleViewInterview(interview)}
                  >
                    <div className="flex justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {interview.title}
                      </h3>
                      {interview.score !== null && interview.score !== undefined && (
                        <div className="px-2 py-1 rounded text-xs bg-purple-500/30 text-purple-100">
                          Score: {interview.score}/10
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center text-white/70 text-sm mb-2">
                      <Calendar size={14} className="mr-1" />
                      {formatDate(interview.created_at)}
                    </div>
                    
                    {interview.feedback && (
                      <div className="mt-2 text-white/80 text-sm line-clamp-2">
                        {interview.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};