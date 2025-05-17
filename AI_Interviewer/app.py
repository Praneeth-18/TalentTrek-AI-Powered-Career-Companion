import re

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.models import Interview, InterviewFeedback, ChatMessage, InterviewStatus
from api.database import Database
from api.openai_service import OpenAIService
import json
from typing import List, Dict, Any
import boto3
from botocore.config import Config
from config import AWS_CONFIG
import os
from pydantic import BaseModel

class ChatMessageRequest(BaseModel):
    role: str
    content: str

app = FastAPI(title="AI Interviewer API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize services
db = Database()
openai_service = OpenAIService()


@app.post("/interviews")
async def create_interview(interview: Interview):
    """Create a new interview and generate the first question."""
    try:
        # Get a random question from the question bank
        random_question = db.get_random_question()
        if not random_question:
            raise HTTPException(status_code=500, detail="Failed to get a random question")

        # Save the question_id in the interview record
        interview.question_id = random_question.id

        # Create the interview
        created_interview = db.create_interview(interview)

        # Create greeting message
        greeting = f"Hello {interview.candidate_name}! Welcome to your {interview.type.value} interview. I'll be your interviewer today. Let's begin with our first question:\n\n{random_question.text}"

        # Create and save the greeting message
        greeting_message = ChatMessage(
            interview_id=created_interview.id,
            role="system",
            content=greeting
        )
        saved_greeting = db.save_chat_message(greeting_message)

        # Return the interview ID and status
        return {
            "interviewId": created_interview.id,
            "status": created_interview.status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/interviews/summary")
async def get_interview_summaries():
    """Get summarized interview data (ID, title, score, feedback only)."""
    try:
        interviews = db.get_interview_summaries()
        return interviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/interviews/{interview_id}")
async def get_interview(interview_id: str):
    """Get interview details."""
    try:
        interview = db.get_interview(interview_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        return interview
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interviews/{interview_id}/transcribe")
async def transcribe_audio(interview_id: str, audio: UploadFile = File(...)):
    """Transcribe audio and store as a chat message."""
    try:
        # Read audio data
        audio_data = await audio.read()
        
        # Transcribe audio
        transcript = openai_service.transcribe_audio(audio_data)
        
        # Create chat message
        message = ChatMessage(
            interview_id=interview_id,
            role="user",
            content=transcript
        )
        
        # Save message
        saved_message = db.save_chat_message(message)
        
        return {"transcript": transcript, "message": saved_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interviews/{interview_id}/evaluate")
async def evaluate_response(interview_id: str, question: str, response: str):
    """Evaluate a candidate's response."""
    try:
        # Get interview history for context
        history = db.get_chat_history(interview_id)
        
        # Evaluate response
        evaluation = openai_service.evaluate_response(question, response, history)
        
        # Create feedback
        feedback = InterviewFeedback(
            interview_id=interview_id,
            category="response_evaluation",
            score=0,  # Score will be extracted from evaluation
            comments=evaluation
        )
        
        # Save feedback
        saved_feedback = db.save_feedback(feedback)
        
        return {"evaluation": evaluation, "feedback": saved_feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interviews/{interview_id}/generate-question")
async def generate_question(interview_id: str):
    """Generate a new interview question."""
    try:
        # Get interview details
        interview = db.get_interview(interview_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Get previous questions
        history = db.get_chat_history(interview_id)
        previous_questions = [msg.content for msg in history if msg.role == "system"]
        
        # Generate question
        question = openai_service.generate_question(interview.type, previous_questions)
        
        # Create chat message
        message = ChatMessage(
            interview_id=interview_id,
            role="system",
            content=question
        )
        
        # Save message
        saved_message = db.save_chat_message(message)
        
        return {"question": question, "message": saved_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interviews/{interview_id}/feedback", response_model=dict)
async def generate_feedback(interview_id: str):
    """Generate comprehensive interview feedback and update interview status."""
    try:
        # Get interview details
        interview = db.get_interview(interview_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Get chat history
        chat_history = db.get_chat_history(interview_id)
        
        # Generate concise feedback using OpenAI
        feedback = openai_service.generate_feedback(chat_history)
        
        # Extract overall score from feedback
        score = 0
        score_patterns = [
            r"Score:?\s*(\d+)(?:/10)?",
            r"Overall:?\s*(\d+)(?:/10)?",
            r"Overall Performance:?\s*(\d+)(?:/10)?"
        ]
        
        for pattern in score_patterns:
            match = re.search(pattern, feedback)
            if match:
                try:
                    score = float(match.group(1))
                    break
                except ValueError:
                    continue
        
        # Save feedback to interview_feedback table
        feedback_entry = InterviewFeedback(
            interview_id=interview_id,
            category="final_feedback",
            score=score,
            comments=feedback
        )
        
        saved_feedback = db.save_feedback(feedback_entry)
        
        # Update interview status to completed
        interview.status = InterviewStatus.COMPLETED
        interview.feedback_summary = feedback[:400] if len(feedback) > 400 else feedback
        interview.score = score
        updated_interview = db.update_interview(interview)
        
        return {
            "success": True,
            "feedback": feedback,
            "score": score,
            "feedback_id": saved_feedback.id if saved_feedback else None
        }
    except Exception as e:
        print(f"Error generating feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/interviews/{interview_id}/history")
async def get_chat_history(interview_id: str):
    """Get chat history for an interview."""
    try:
        return db.get_chat_history(interview_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Chat APIs
@app.post("/api/chat/{interview_id}")
async def send_message(interview_id: str, message: ChatMessageRequest):
    """Send a chat message and get AI response."""
    try:
        # Save user message
        user_chat_message = ChatMessage(
            interview_id=interview_id,
            role=message.role,
            content=message.content
        )
        saved_user_message = db.save_chat_message(user_chat_message)

        # Get chat history for context
        chat_history = db.get_chat_history(interview_id)

        # Get interview details to understand context
        interview = db.get_interview(interview_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        # Format messages for OpenAI
        formatted_messages = [
            {"role": "system", "content": """You are a professional technical interviewer conducting a coding interview. Follow these rules strictly:
Only discuss the current coding interview question. Never reference unrelated topics.
Never provide implementation help, examples, or pseudocode. Only clarify the problem statement if asked.
If the candidate is stuck, give at most one brief hint (under 10–15 words) that suggests a general approach, without naming specific algorithms or data structures.
Example: “Try reducing repeated work using a fixed-size moving view of the data.”
NOT: “Use a sliding window.”
Never name specific techniques like DFS, heaps, tries, or dynamic programming. Only describe what they help achieve.
Example: “Can you track previously seen paths efficiently?”
Maintain a professional, neutral tone. Do not give opinions, encouragement, or commentary.
Ask concise follow-up questions testing understanding of time/space complexity and edge cases.
Never provide complete or partial solutions. Only guide using high-level conceptual prompts.
If the candidate goes off-topic, politely steer them back to the problem.
Do not discuss motivation, company culture, or non-technical topics. Focus entirely on code, algorithms, and best practices.
Keep all responses focused, concise, and technical. No filler, small talk, or elaboration unless clarification is requested.
                """}
        ]

        # Add conversation history (limited to last 10 messages for context)
        for msg in chat_history[-10:]:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        # Generate AI response
        ai_response = openai_service.generate_chat_response(formatted_messages)

        # Save AI response
        ai_chat_message = ChatMessage(
            interview_id=interview_id,
            role="assistant",
            content=ai_response
        )
        saved_ai_message = db.save_chat_message(ai_chat_message)

        return {
            "user_message": saved_user_message,
            "ai_response": saved_ai_message
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/{interview_id}")
async def get_chat_history(interview_id: str):
    """Get chat history for an interview."""
    try:
        return db.get_chat_history(interview_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/{interview_id}")
async def delete_chat_history(interview_id: str):
    """Delete chat history for an interview."""
    try:
        # TODO: Implement delete_chat_history in Database class
        return {"message": "Chat history deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/interviews")
async def get_interviews():
    """Get all interviews."""
    try:
        # Implement a method in the Database class to get all interviews
        interviews = db.get_all_interviews()
        return interviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



class CodeRequest(BaseModel):
    code: str

@app.get("/interviews/user/{username}")
async def get_interviews_by_user(username: str):
    """Get all interviews for a specific user."""
    try:
        # URL decode the username in case it was URL encoded
        import urllib.parse
        decoded_username = urllib.parse.unquote(username)
        
        # Get interviews using the database method
        interviews = db.get_interviews_by_user(decoded_username)
        
        # Convert the list of Interview objects to a list of dictionaries
        # with the structure needed by the frontend
        interview_data = []
        for interview in interviews:
            interview_data.append({
                "interviewId": interview.id,
                "title": interview.title,
                "score": interview.score,
                "feedback": interview.feedback_summary,
                "created_at": interview.created_at.isoformat() if hasattr(interview.created_at, 'isoformat') else str(interview.created_at)
            })
        
        return interview_data
    except Exception as e:
        print(f"Error getting interviews for user {username}: {e}")
        raise HTTPException(status_code=500, detail=str(e))    

@app.post("/interviews/{interview_id}/evaluate-code")
async def evaluate_code(interview_id: str, request: CodeRequest):
    """Evaluate the submitted code for the current question and include follow-up questions."""
    try:
        # Get the code from the request body
        code = request.code
        
        # Get interview details
        interview = db.get_interview(interview_id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # Get the question directly from the interview record
        question_id = interview.question_id
        if not question_id:
            # Fallback: try to extract from chat history if not found in interview record
            chat_history = db.get_chat_history(interview_id)
            for message in reversed(chat_history):
                if message.role == "system" and "Question ID:" in message.content:
                    question_id_match = re.search(r"Question ID: (\w+)", message.content)
                    if question_id_match:
                        question_id = question_id_match.group(1)
                    break
        
        if not question_id:
            raise HTTPException(status_code=400, detail="No question ID found for this interview")
            
        # Get the question details
        question = db.get_question_by_id(question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
            
        # Get follow-up questions if available
        follow_ups = []
        if question.follow_ups:
            follow_ups = question.follow_ups
        
        # Create an enhanced prompt that focuses strictly on the question
        prompt = f"""
        You are evaluating code for the specific question below. Your evaluation must:
        
        1. ONLY evaluate the code's correctness for THIS SPECIFIC QUESTION
        2. Focus STRICTLY on the solution's time and space complexity bit do not mention in evaluation
        3. Keep your feedback under 300 characters total
        4. Use this specific format:
           - Correctness: [Yes/Partially/No]
           - Key Issues: [1-2 bullet points max]
        5. DO NOT explain code that wasn't written
        6. DO NOT analyze anything beyond what's needed for this specific problem
        7. Include 1-2 very brief follow-up questions focused on optimization
        8. Have them formatted in different line
        Question: {question.text}
        
        Submitted Code:
        ```
        {code}
        ```
        """
        
        # Add follow-up questions if available
        if follow_ups:
            prompt += f"\nInclude the following follow-up questions in your response (max 2): {', '.join(follow_ups[:2])}"
        
        # Evaluate the code using OpenAI with our enhanced prompt
        evaluation = openai_service.evaluate_response(question.text, code, prompt=prompt)
        
        # Save both the code submission and the AI evaluation as chat messages
        code_message = ChatMessage(
            interview_id=interview_id,
            role="user",
            content=f"```\n{code}\n```"
        )
        db.save_chat_message(code_message)
        
        # Save the AI evaluation as a system message
        eval_message = ChatMessage(
            interview_id=interview_id,
            role="system",
            content=evaluation
        )
        saved_eval = db.save_chat_message(eval_message)
        
        # Return just the evaluation to display in the frontend
        return {
            "evaluation": evaluation,
            "message_id": saved_eval.message_id
        }
    except Exception as e:
        print(f"Error evaluating code: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    