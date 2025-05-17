// types.ts
export enum InterviewType {
    TECHNICAL = 'TECHNICAL',
    FRONTEND = 'FRONTEND',
    BACKEND = 'BACKEND',
    FULLSTACK = 'FULLSTACK',
    SYSTEM_DESIGN = 'SYSTEM_DESIGN',
    DATA_SCIENCE = 'DATA_SCIENCE',
    MACHINE_LEARNING = 'MACHINE_LEARNING',
    DEVOPS = 'DEVOPS',
    MOBILE = 'MOBILE'
  }
  
  export enum InterviewStatus {
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
  }
  
  export interface Interview {
    id: string;
    title: string;
    job_type: string;
    candidate_name: string;
    company: string;
    created_at: string;
    status: InterviewStatus;
    type: InterviewType;
    updated_at: string;
    feedback_summary?: string;
    score?: number;
  }
  
  export interface ChatMessage {
    message_id: string;
    interview_id: string;
    role: 'user' | 'system' | 'assistant';
    content: string;
    timestamp: string;
  }
  
  export interface InterviewFeedback {
    id?: number;
    interview_id: string;
    category: string;
    score: number;
    comments: string;
    created_at: string;
  }
  
  export interface CodeEvaluation {
    evaluation: string;
    feedback: InterviewFeedback;
    follow_ups?: string[];
  }