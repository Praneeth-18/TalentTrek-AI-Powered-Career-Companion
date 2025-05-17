import axios from 'axios';
import { Interview, ChatMessage, InterviewType } from './types';

interface StreamlinedInterview {
  interviewId: string;
  title: string;
  score: number | null;
  feedback: string | null;
  created_at: string;
}

const API_BASE_URL = 'http://18.222.164.201:8002';

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const interviewApi = {
  // Create a new interview
  createInterview: async (interviewData: {
    title: string;
    job_type: string;
    candidate_name: string;
    company: string;
    type: InterviewType;
  }): Promise<{
    interviewId: string;
    status: string;
  }> => {
    const response = await apiClient.post('/interviews', interviewData);
    return {
      interviewId: response.data.interviewId,
      status: response.data.status
    };
  },

  // Get interviews by username (primary method for getting user's interviews)
  // getInterviewsByUser: async (username: string): Promise<StreamlinedInterview[]> => {
  //   try {
  //     if (!username) {
  //       console.warn('No username provided to getInterviewsByUser');
  //       return [];
  //     }
      
  //     const response = await apiClient.get(`/interviews/user/${encodeURIComponent(username)}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error fetching interviews for user ${username}:`, error);
  //     // Return an empty array instead of throwing, to handle errors gracefully
  //     return [];
  //   }
  // },

  // Get interview details
  getInterview: async (interviewId: string): Promise<Interview> => {
    const response = await apiClient.get(`/interviews/${interviewId}`);
    return response.data;
  },

  // Get all interviews (streamlined data)
  // getInterviews: async (): Promise<StreamlinedInterview[]> => {
  //   try {
  //     const response = await apiClient.get('/interviews/summary');
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error fetching interviews:', error);
  //     // Return an empty array instead of throwing, to handle errors gracefully
  //     return [];
  //   }
  // },
   // Get all interviews
  getInterviews: async (): Promise<Interview[]> => {
    try {
      const response = await apiClient.get('/interviews');
      return response.data;
    } catch (error) {
      console.error('Error fetching interviews:', error);
      // Return an empty array instead of throwing, to handle errors gracefully
      return [];
    }
  },

  // Get interviews by username
  getInterviewsByUser: async (username: string): Promise<Interview[]> => {
    try {
      const response = await apiClient.get(`/interviews/user/${encodeURIComponent(username)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching interviews for user ${username}:`, error);
      // Return an empty array instead of throwing, to handle errors gracefully
      return [];
    }
  },

  // Get chat history for an interview
  getChatHistory: async (interviewId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/api/chat/${interviewId}`);
    return response.data;
  },

  // Send chat message
  sendMessage: async (interviewId: string, message: { role: string; content: string }): Promise<ChatMessage> => {
    const response = await apiClient.post(`/api/chat/${interviewId}`, message);
    return response.data;
  },

  // Evaluate code submission
  evaluateCode: async (interviewId: string, code: string): Promise<{
    evaluation: string;
    message_id: string;
  }> => {
    // Make sure we're only sending the code as a string in a JSON object
    // Don't pass any DOM elements or React components
    const codePayload = { code: code.toString() };
    
    try {
      const response = await apiClient.post(
        `/interviews/${interviewId}/evaluate-code`, 
        codePayload
      );
      return response.data;
    } catch (error) {
      console.error('Error in evaluateCode:', error);
      throw error;
    }
  },

  // Generate a new question
  generateQuestion: async (interviewId: string): Promise<any> => {
    const response = await apiClient.post(`/interviews/${interviewId}/generate-question`);
    return response.data;
  },


  // Generate final feedback
generateFeedback: async (interviewId: string): Promise<{
  success: boolean;
  feedback?: string;
}> => {
  try {
    const response = await apiClient.post(`/interviews/${interviewId}/feedback`);
    return {
      success: true,
      feedback: response.data.feedback
    };
  } catch (error) {
    console.error('Error generating feedback:', error);
    return {
      success: false
    };
  }
},

  // Delete chat history
  deleteChatHistory: async (interviewId: string): Promise<any> => {
    const response = await apiClient.delete(`/api/chat/${interviewId}`);
    return response.data;
  }
};