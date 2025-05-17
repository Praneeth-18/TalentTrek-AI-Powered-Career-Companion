import openai
from typing import List, Dict, Any
import tempfile
import os
from tenacity import retry, stop_after_attempt, wait_exponential

from api import ChatMessage
from config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_MAX_TOKENS, RATE_LIMIT

class OpenAIService:  
    def __init__(self):
        openai.api_key = OPENAI_API_KEY

        self.model = OPENAI_MODEL
        self.temperature = OPENAI_TEMPERATURE
        self.max_tokens = OPENAI_MAX_TOKENS
        print("OpenAI Service initialized")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def transcribe_audio(self, audio_data: bytes) -> str:
        """Transcribe audio using OpenAI Whisper model."""
        try:
            # Create a temporary file for the audio data
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name

            # Transcribe the audio
            with open(temp_file_path, "rb") as audio_file:
                transcript = openai.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="json"
                )

            # Clean up the temporary file
            os.unlink(temp_file_path)
            return transcript.text

        except Exception as e:
            print(f"Error transcribing audio: {e}")
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def evaluate_response(self, question: str, response: str, context: List[Dict[str, Any]] = None,
                          prompt: str = None) -> str:
        """Evaluate a candidate's response using GPT model with an optional custom prompt."""
        try:
            if prompt:
                # If a custom prompt is provided, use it directly
                messages = [
                    {"role": "system", "content": "You are an AI interviewer evaluating a candidate's response."},
                    {"role": "user", "content": prompt}
                ]
            else:
                # Use the default evaluation approach
                messages = [
                    {"role": "system", "content": "You are an AI interviewer evaluating a candidate's response. "
                                                  "Provide a detailed evaluation including:\n"
                                                  "1. Technical Accuracy (0-10)\n"
                                                  "2. Clarity of Explanation (0-10)\n"
                                                  "3. Problem-Solving Approach (0-10)\n"
                                                  "4. Overall Score (0-10)\n"
                                                  "5. Detailed Feedback\n"
                                                  "6. Areas for Improvement\n"
                                                  "7. Strengths\n"
                                                  "Format the response as a structured JSON object."}
                ]

                # Add context if provided
                if context:
                    for ctx in context:
                        messages.append({"role": "user", "content": ctx.get("question", "")})
                        messages.append({"role": "assistant", "content": ctx.get("response", "")})

                # Add current question and response
                messages.append({"role": "user", "content": f"Question: {question}\nResponse: {response}"})

            # Make the API call
            response = openai.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"Error evaluating response: {e}")
            raise

    

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def generate_chat_response(self, messages: List[Dict[str, Any]]) -> str:
        """Generate a response to a chat message using OpenAI's chat API."""
        try:
            response = openai.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating chat response: {e}")
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def generate_feedback(self, interview_history: List[ChatMessage]) -> str:
        """Generate comprehensive interview feedback from chat history."""
        try:
            messages = [
                {"role": "system", "content": """
                Generate precise technical interview feedback following these strict guidelines:
                
                1. MUST be under 300 characters total
                2. Format as:
                   - Score: [0-10]/10
                   - Areas to Improve: [1-2 points, max 60 chars each]
                   - Overall: [Single sentence summary]
                3. Evaluate ONLY technical problem-solving ability, code quality, and communication
                4. Be specific about algorithms, data structures, and complexity analysis
                5. NO generic feedback - point to specific answers/code from the interview
                6. NO lengthy explanations or pleasantries
                7. Focus on actionable, technical improvement points
                8. If any questions outside of the interview scope is asked related to politics, sports etc or trying to steer the conversation from the interview, the score should be deducted and mentioned in feedback
                """}
            ]

            # Add interview history
            for message in interview_history:
                if message.role == "user":
                    messages.append({"role": "user", "content": message.content})
                elif message.role == "system" or message.role == "assistant":
                    messages.append({"role": "assistant", "content": message.content})

            response = openai.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"Error generating feedback: {e}")
            raise