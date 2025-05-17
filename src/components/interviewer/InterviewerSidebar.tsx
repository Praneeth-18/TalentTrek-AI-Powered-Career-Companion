import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, History } from 'lucide-react';
import { InterviewPanel } from './InterviewPanel';

export const InterviewerSidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<'new' | 'history' | null>(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setActivePanel(null);
    }
  };

  const handleOptionClick = (panel: 'new' | 'history') => {
    setActivePanel(panel);
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  return (
    <div className="fixed right-0 top-1/3 z-50 flex h-auto">
      {/* Main sidebar tab */}
      <div 
        className="flex cursor-pointer items-center rounded-l-lg bg-opacity-20 bg-purple-900 backdrop-blur-md backdrop-filter transition-all duration-300 border border-r-0 border-white/10 shadow-lg hover:bg-opacity-30"
        onClick={toggleExpand}
      >
        <div className="p-4 flex items-center">
          <MessageSquare size={24} className="text-white mr-2" />
          <span className="text-white font-medium">Mock Interviewer</span>
          {isExpanded ? (
            <ChevronDown size={20} className="text-white ml-2" />
          ) : (
            <ChevronRight size={20} className="text-white ml-2" />
          )}
        </div>
      </div>

      {/* Expandable menu */}
      {isExpanded && (
        <div 
          className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-purple-900 bg-opacity-20 backdrop-blur-lg backdrop-filter p-2 border border-white/10 shadow-lg transition-all duration-300"
        >
          <div 
            className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-all duration-200"
            onClick={() => handleOptionClick('new')}
          >
            <MessageSquare size={20} className="text-white mr-2" />
            <span className="text-white">New Interview</span>
          </div>
          <div 
            className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-all duration-200"
            onClick={() => handleOptionClick('history')}
          >
            <History size={20} className="text-white mr-2" />
            <span className="text-white">Interview History</span>
          </div>
        </div>
      )}

      {/* Render the interview panel if an option is selected */}
      {activePanel === 'new' && (
        <InterviewPanel 
          onClose={handleClosePanel} 
          interviewData={{
            interview: null,
            interviewId: 'new',
            messages: []
          }} 
        />
      )}

      {/* Interview History Panel would go here */}
      {activePanel === 'history' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-2/3 h-2/3 bg-white bg-opacity-10 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Interview History</h2>
              <button
                className="rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors text-white"
                onClick={handleClosePanel}
              >
                ✕
              </button>
            </div>
            <div className="h-5/6 overflow-y-auto p-4">
              <p className="text-white text-opacity-80">No interview history found.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};