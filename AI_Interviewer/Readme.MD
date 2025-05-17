Mock Interview Platform Backend
A Flask-based backend for a professional mock interview platform that supports a React/Chakra UI frontend, featuring real-time transcription and AI-powered interview responses.
Project Structure
Copymock_interview_platform/
│
├── app.py                           # Main application entry point
├── config.py                        # Configuration settings
├── requirements.txt                 # Project dependencies
│
├── api/                             # API module
│   ├── __init__.py
│   ├── routes/                      # Route definitions
│   │   ├── __init__.py
│   │   └── mock_interview.py        # Mock interview endpoints
│   │
│   └── utils/                       # Utility functions
│       ├── __init__.py
│       ├── simple_chat_repo.py      # Simple chat message repository
│       └── simple_evaluator.py      # Simple interview evaluator
│
└── data/                            # Directory for storing chat messages
Setup Instructions for PyCharm
1. Create a New Project

Open PyCharm
Select "Create New Project"
Choose a location for your project
Select "Python" as the project type
Choose your Python interpreter (create a virtual environment if prompted)
Click "Create"

2. Set Up the Project Structure

Create the directory structure as shown above
Right-click on your project folder in PyCharm → New → Directory
Create all the necessary directories (api, api/routes, api/utils, data)

3. Create the Python Files

Create all the necessary Python files:

app.py - Main application file
config.py - Configuration settings
api/__init__.py - Empty file to mark directory as a package
api/routes/__init__.py - Route registration
api/routes/mock_interview.py - Mock interview endpoints
api/utils/__init__.py - Empty file to mark directory as a package
api/utils/simple_chat_repo.py - Simple chat repository
api/utils/simple_evaluator.py - Simple interview evaluator


Copy and paste the code into each file

4. Install Dependencies

Create requirements.txt with the following content:
CopyFlask==2.3.2
Flask-Cors==4.0.0
Werkzeug==2.3.6
python-dotenv==1.0.0

Open a terminal in PyCharm (View → Tool Windows → Terminal)
Run: pip install -r requirements.txt

5. Run the Application

In PyCharm, click on "Add Configuration" in the top right
Click the "+" button → Python
Set the following:

Name: "Flask Dev Server"
Script path: Select your app.py file
Environment variables: FLASK_ENV=development;FLASK_APP=app.py
Check "Emulate terminal in output console"


Click "OK"
Click the green "Run" button in the top right
The Flask server should start on http://127.0.0.1:5000/

API Endpoints
Mock Interview

POST /api/mock/new - Create a new interview session

Request: { "title": "Optional title", "job_type": "frontend|backend|fullstack" }
Response: { "interview_id": "uuid", "title": "Interview Title", "initial_message": "..." }


POST /api/mock/chat - Process a chat message and get AI response

Request: { "message": "User message", "interview_id": "uuid", "interview_type": "frontend|backend|fullstack" }
Response: { "response": "AI response", "timestamp": "ISO timestamp", "is_coding_question": false }


POST /api/mock/transcribe - Process audio transcription

Request: Audio file or { "transcription": "Transcript text", "interview_id": "uuid" }
Response: { "success": true, "transcription": "Transcribed text", "timestamp": "ISO timestamp" }


GET /api/mock/chat/history/<interview_id> - Get chat history for an interview

Response: { "messages": [...], "total": 10 }


GET /api/mock/previous - Get previous interview sessions

Response: { "interviews": [...], "total": 5 }


GET /api/mock/<interview_id> - Get specific interview details

Response: { interview details... }


POST /api/mock/<interview_id>/end - End an interview session

Response: { "status": "Interview successfully completed", "interview": {...} }



Testing
You can test the API using tools like Postman or curl:
bashCopy# Create new interview
curl -X POST http://localhost:5000/api/mock/new \
  -H "Content-Type: application/json" \
  -d '{"job_type": "frontend", "title": "Frontend Developer Interview"}'

# Send chat message
curl -X POST http://localhost:5000/api/mock/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about your experience with React", "interview_id": "<INTERVIEW_ID>"}'

# End interview
curl -X POST http://localhost:5000/api/mock/<INTERVIEW_ID>/end
Integration with Frontend
To integrate with a React/Chakra UI frontend:

Set up CORS in your Flask app (already configured)
Make API calls from your React app to the endpoints
Handle the responses to update your UI

For real-time transcription, you can use the Web Speech API in the browser or send audio files to the /api/mock/transcribe endpoint.