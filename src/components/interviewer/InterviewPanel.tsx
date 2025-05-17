import React, { useState, useEffect } from 'react';
import { X, Timer } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { CodeEditor } from './CodeEditor';
import { Interview, ChatMessage } from './types';
import { interviewApi } from './api';

interface InterviewPanelProps {
  onClose: () => void;
  interviewData: {
    interview: Interview | null;
    interviewId: string;
    messages?: ChatMessage[];
  };
}

export const InterviewPanel: React.FC<InterviewPanelProps> = ({ onClose, interviewData }) => {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isActive, setIsActive] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEndingInterview, setIsEndingInterview] = useState(false);

  useEffect(() => {
    // Initialize the component
    setMounted(true);
    
    // Log the interview data for debugging
    console.log('Interview Data:', interviewData);
    console.log("INTERVIEW ID:", interviewData?.interviewId);
    // If we already have messages from props, use those
    if (interviewData && interviewData.messages && interviewData.messages.length > 0) {
      setMessages(interviewData.messages);
      setIsLoading(false);
      return;
    }
    
    // Otherwise, fetch chat history
    const fetchChatHistory = async () => {
      if (!interviewData || !interviewData.interviewId) {
        console.error('No interview ID provided');
        setError('Failed to load interview data: Missing interview ID');
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('Fetching chat history for interview ID:', interviewData.interviewId);
        const history = await interviewApi.getChatHistory(interviewData.interviewId);
        console.log('Chat history received:', history);
        
        if (history && history.length > 0) {
          setMessages(history);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
        setError('Failed to load chat history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
    return () => setMounted(false);
  }, [interviewData]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            clearInterval(intervalId);
            handleEndInterview();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEndInterview = async () => {
    if (isEndingInterview) return;
    
    // Check for interview ID
    const interviewId = interviewData?.interviewId || interviewData?.interview?.id;
    
    if (!interviewId) {
      console.error('Cannot end interview: missing interview ID');
      setError('Cannot end interview: missing interview data');
      return;
    }
    
    try {
      setIsEndingInterview(true);
      setIsLoading(true);
      setIsActive(false);
      console.log('Ending interview session for ID:', interviewData.interviewId);
      const endingMessage: ChatMessage = {
        message_id: `system-ending-${Date.now()}`,
        interview_id: interviewId,
        role: 'system',
        content: 'Generating final feedback for your interview performance...',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, endingMessage]);
      // 1. Generate final feedback using the API
      const feedbackResponse = await interviewApi.generateFeedback(interviewData.interviewId);
      console.log('Feedback response:', feedbackResponse);
      
      // 2. If successful, close the interview panel
      if (feedbackResponse && feedbackResponse.success) {
        const feedbackMessage: ChatMessage = {
          message_id: `system-feedback-${Date.now()}`,
          interview_id: interviewId,
          role: 'system',
          content: 'Your interview has concluded. You can view your detailed feedback and score in the Interview History.',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, feedbackMessage]);
        
        // Wait a moment to let the user see the feedback message before closing
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        console.error('Failed to generate feedback:', feedbackResponse);
        setError('Failed to generate interview feedback. Please try again.');
        setIsActive(true);
      }
    } catch (err) {
      console.error('Failed to end interview:', err);
      setError('Failed to end interview properly.');
      setIsActive(true);
    } finally {
      setIsEndingInterview(false);
      setIsLoading(false);
    }
  };

  const handleCheckCode = async (code: string) => {
    if (!interviewData || !interviewData.interviewId) {
      console.error('Cannot evaluate code: missing interview ID');
      setError('Cannot evaluate code: missing interview data');
      return null;
    }
    
    setIsLoading(true);
    console.log('Evaluating code for interview ID:', interviewData.interviewId);
    console.log('Code sample (first 100 chars):', code.substring(0, 100));
    
    try {
      // Make sure code is just a string
      const codeString = typeof code === 'string' ? code : JSON.stringify(code);
      
      // The API now directly returns the AI evaluation response
      const result = await interviewApi.evaluateCode(interviewData.interviewId, codeString);
      console.log('Code evaluation result:', result);
      
      if (result && result.evaluation) {
        // We don't need to create a message - the backend already did that
        // Just refetch all messages to get the latest including the evaluation
        console.log('Fetching updated messages after code evaluation');
        const updatedMessages = await interviewApi.getChatHistory(interviewData.interviewId);
        setMessages(updatedMessages);
      }
      
      return result;
    } catch (err) {
      console.error('Failed to evaluate code:', err);
      setError('Failed to evaluate code. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!interviewData || !interviewData.interviewId || !message.trim()) {
      console.error('Cannot send message: missing data');
      setError('Cannot send message: missing interview data');
      return;
    }
    
    console.log('Sending message for interview ID:', interviewData.interviewId);
    
    // Create user message
    const userMessage: ChatMessage = {
      message_id: Date.now().toString(),
      interview_id: interviewData.interviewId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    // Add message to UI immediately
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Send message to backend
    try {
      const response = await interviewApi.sendMessage(interviewData.interviewId, {
        role: 'user',
        content: message
      });
      
      console.log('Message sent, response:', response);
      
      // Wait a bit for the AI to generate a response
      setTimeout(async () => {
        console.log('Fetching updated messages');
        // Fetch updated messages
        const updatedMessages = await interviewApi.getChatHistory(interviewData.interviewId);
        setMessages(updatedMessages);
      }, 1000);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const getTimerClasses = () => {
    if (timeLeft <= 60) { // Last minute
      return "text-red-400 font-bold animate-pulse";
    } else if (timeLeft <= 300) { // Last 5 minutes
      return "text-yellow-400 font-bold";
    }
    return "text-white font-mono";
  };

  return (
    <div 
      className={`fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md transition-opacity duration-300 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`w-11/12 h-5/6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl transition-all duration-300 ${
          mounted ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className="relative h-full flex flex-col">
          {/* Header with Timer and End Interview button */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {interviewData?.interview?.title || 'Mock Interview Session'}
              </h2>
              <p className="text-white/70 text-sm">
                {interviewData?.interview?.candidate_name || 'Candidate'} • 
                {interviewData?.interview?.job_type || 'Job Type'} • 
                {interviewData?.interview?.type || 'Interview Type'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg">
                <Timer size={18} className="text-white" />
                <span className={getTimerClasses()}>{formatTime(timeLeft)}</span>
              </div>
              <button
                className="flex items-center space-x-2 rounded-lg bg-red-500 bg-opacity-20 px-4 py-2 text-red-100 backdrop-blur-md backdrop-filter hover:bg-opacity-30 transition-all duration-200 border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEndInterview}
                disabled={isLoading || isEndingInterview}
              >
                <span>{isEndingInterview ? 'Ending...' : 'End Interview'}</span>
                <X size={18} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-500 bg-opacity-20 text-red-100 rounded-md">
              {error}
              <button 
                className="ml-2 font-bold" 
                onClick={() => setError('')}
              >
                ✕
              </button>
            </div>
          )}

          {/* Main content area */}
          <div className="flex flex-1 space-x-4 h-full overflow-hidden">
            {/* Chat Window */}
            <div className="w-1/2 h-full">
              <ChatWindow 
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>

            {/* Code Editor */}
            <div className="w-1/2 h-full">
              <CodeEditor onCheckCode={handleCheckCode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};