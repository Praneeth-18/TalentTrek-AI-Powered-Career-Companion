import React, { useState,useEffect  } from 'react';
import { X } from 'lucide-react';
import { InterviewType } from './types';
import { useAuth } from '@/contexts/AuthContext';

interface InterviewFormProps {
  onSubmit: (data: {
    title: string;
    company: string;
    candidateName: string;
    jobType: string;
    type: InterviewType;
  }) => void;
  onClose: () => void;
}

export const InterviewForm: React.FC<InterviewFormProps> = ({ onSubmit, onClose }) => {
  
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    candidateName: user?.name || user?.email || '', // Set default from user context
    jobType: 'Software Engineer'
    // Type is not included in the state as it's always BACKEND
  });

  // Update candidateName if user changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      candidateName: user?.name || user?.email || ''
    }));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add the BACKEND type on submission
    onSubmit({
      ...formData,
      type: InterviewType.BACKEND
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md">
      <div className="w-[480px] bg-white bg-opacity-10 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">New Interview</h2>
          <button
            className="rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors text-white"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Interview Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="e.g., Backend Developer Interview"
              required
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-white mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="e.g., TechCorp Inc."
              required
            />
          </div>

           {/* Read-only field for candidate name */}
           <div>
            <label htmlFor="candidateName" className="block text-sm font-medium text-white mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="candidateName"
              name="candidateName"
              value={formData.candidateName}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-not-allowed opacity-70"
              readOnly
            />
            <p className="text-xs text-white/50 mt-1">
            </p>
          </div>

          <div>
            <label htmlFor="jobType" className="block text-sm font-medium text-white mb-2">
              Job Type
            </label>
            <input
              type="text"
              id="jobType"
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="e.g., Software Engineer"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-purple-500 bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg border border-purple-500/20 transition-colors duration-200"
          >
            Start Interview
          </button>
        </form>
      </div>
    </div>
  );
};