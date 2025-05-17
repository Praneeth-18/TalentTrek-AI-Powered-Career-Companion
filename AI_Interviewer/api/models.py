from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum

class CodeSubmission(BaseModel):
    code: str

class InterviewType(str, Enum):
    TECHNICAL = "TECHNICAL"
    FRONTEND = "FRONTEND"
    BACKEND = "BACKEND"
    FULLSTACK = "FULLSTACK"
    SYSTEM_DESIGN = "SYSTEM_DESIGN"
    DATA_SCIENCE = "DATA_SCIENCE"
    MACHINE_LEARNING = "MACHINE_LEARNING"
    DEVOPS = "DEVOPS"
    MOBILE = "MOBILE"


class InterviewStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Interview(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    job_type: str
    candidate_name: str
    company: str
    created_at: datetime = Field(default_factory=datetime.now)
    status: InterviewStatus = InterviewStatus.IN_PROGRESS
    type: InterviewType
    updated_at: datetime = Field(default_factory=datetime.now)
    feedback_summary: Optional[str] = None
    score: Optional[float] = None
    question_id: Optional[str] = None  # Added field for storing the current question ID



class ChatMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: str(uuid4()))
    interview_id: str
    role: str  # "user" | "system" | "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class DsaQuestionBank(BaseModel):
    id: str
    text: str
    difficulty: int = Field(default=3, ge=1, le=5)
    follow_ups: Optional[List[str]] = None


class CodeEvaluation(BaseModel):
    interview_id: str
    code: str
    question_id: str
    evaluation_result: Optional[Dict[str, Any]] = None
    feedback: Optional[str] = None
    score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.now)


class InterviewFeedback(BaseModel):
    id: Optional[int] = None
    interview_id: str
    category: str
    score: float
    comments: str
    created_at: datetime = Field(default_factory=datetime.now)




class ChatMessageRequest(BaseModel):
    role: str
    content: str