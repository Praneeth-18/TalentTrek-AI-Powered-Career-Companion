# Job Portal with Authentication, Resume Customization, and AI Interviewer

A comprehensive job portal application with job listings, application tracking, AWS Cognito authentication, AI-powered resume customization features, and an AI-powered mock interview platform.

[YouTube Demo Video](https://youtu.be/XoBCiAksn98)

[TalentTrek Project Presentation Slides](https://www.slideshare.net/slideshow/s10-talenttrek-project-presentation-slides/279228583)

## 🌟 Features

- User authentication with AWS Cognito
- Job listings dashboard with filtering by category
- Job application tracking system
- AWS RDS PostgreSQL database integration
- H1B visa sponsorship filter
- My Applications page with status tracking
- AI-powered resume customization service
- AI-powered mock interview platform
- Real-time transcription and voice recording
- Text-to-speech capability for interview responses
- Interview feedback and evaluation
- Responsive modern UI designed with Tailwind CSS

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: 
  - Next.js API routes
  - Python FastAPI for resume service
  - Flask/FastAPI for AI Interviewer
- **Database**: 
  - PostgreSQL on AWS RDS
  - MySQL for mock interview data
- **Authentication**: AWS Cognito
- **AI**: 
  - LLM integration for resume customization
  - OpenAI integration for mock interviews
- **Job Scraping**: Python scripts with scheduled job scraping

## 📋 Project Structure

- `src/` - Next.js application code
  - `app/` - Next.js app router components and pages
  - `components/` - Reusable React components
  - `services/` - Backend service functions
  - `contexts/` - React context providers for auth
  - `lib/` - Database connectors and helpers
- `scripts/` - Python scripts for job scraping and processing
- `resume-service/` - FastAPI service for resume customization
- `AI_Interviewer/` - Flask/FastAPI backend for mock interview platform
  - `api/` - API modules for the interview service
  - `app.py` - Main application entry point
  - `config.py` - Configuration settings
- `public/` - Static assets
- `prisma/` - Prisma schema for local development

## 🚀 Setup and Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ for AI Interviewer, Python 3.11+ for other services
- PostgreSQL 14+ (local or AWS RDS)
- MySQL 8.0 for AI Interviewer
- AWS account (for Cognito and RDS)
- OpenAI API key for AI Interviewer

### Clone the Repository

```bash
git clone https://github.com/Praneeth-18/TalentTrek-AI-Powered-Career-Companion.git
cd TalentTrek-AI-Powered-Career-Companion
```

### Environment Setup

Create a `.env.local` file in the project root with the following variables:

```
# Database Connection
DATABASE_URL="postgresql://ttadmin:yourpassword@your-aws-rds-endpoint:5432/joblistingsportal"

# AWS Cognito Configuration
NEXT_PUBLIC_USER_POOL_ID="us-east-2_XXXXXXXX"
NEXT_PUBLIC_USER_POOL_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_AWS_REGION="us-east-2"

# API Configuration
RESUME_SERVICE_URL="http://localhost:8000"
JWT_SECRET="your-secure-jwt-secret"

# OpenAI Configuration (for AI Interviewer)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-4"
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000
```

### Install Dependencies

For the main application:
```bash
npm install
```

For the resume service:
```bash
cd resume-service/backend
pip install -r requirements.txt
```

For the AI Interviewer service:
```bash
cd AI_Interviewer
pip install -r requirements.txt
```

For the job scraping scripts:
```bash
python3.11 -m venv py311env
source py311env/bin/activate
pip install -r requirements.txt
```

### Running the Components

Follow these steps in order:

#### 1. Job Scraper (Optional, for populating jobs)

Run the job scheduler to scrape and process job listings:
```bash
./run_job_scheduler.sh
```

This script will:
- Set up a Python virtual environment
- Install required dependencies
- Run the job scraper to populate your database with job listings
- Process the listings and add them to the database

#### 2. Apply Links Processor (Optional)

For processing job application links:
```bash
./fetch_actual_links.sh
```

This script:
- Updates job listings with actual application links
- Improves the accuracy of application redirects

#### 3. Resume Service Backend

Start the resume customization service:
```bash
cd resume-service/backend
python -m uvicorn main:app --reload
```

This service will run on http://localhost:8000

#### 4. AI Interviewer Backend

Start the AI interviewer service:

##### Option 1: Direct Run
```bash
cd AI_Interviewer
uvicorn app:app --reload --port 5000
```

##### Option 2: Using Docker
```bash
cd AI_Interviewer
docker-compose up
```

The AI Interviewer service will run on http://localhost:5000 (direct run) or http://localhost:8000 (Docker)

#### 5. Main Application

Finally, start the main Next.js application:
```bash
npm run dev
```

The application will be available at http://localhost:3000

## 🔄 Updating Job Listings

The job listings are automatically fetched and updated by the job scheduler. If you need to manually update job listings:

1. Run the job scheduler script:
   ```bash
   ./run_job_scheduler.sh
   ```

2. For processing apply links:
   ```bash
   ./fetch_actual_links.sh
   ```

## 📊 AWS RDS Database

The application uses AWS RDS PostgreSQL. Important notes:

- The database connection uses the `ttadmin` user, not the default `postgres` user
- All database operations connect to the RDS instance directly
- Job scraping scripts and the main application both use the same RDS instance
- The database contains job listings, user applications, and interaction history

## 🧪 Authentication with AWS Cognito

The application uses AWS Cognito for authentication:

1. Users register through the Register page
2. Verification is sent to their email
3. After verification, users can log in
4. Authentication state is managed through the AuthContext provider

## 📝 Resume Customization Service

The resume customization service allows users to:

1. Upload their basic resume
2. Select a job listing to apply for
3. Get an AI-customized resume tailored to that specific job
4. Download the customized resume as a PDF

## 🎙️ AI Mock Interview Platform

The AI-powered mock interview platform enables users to:

1. Create a new interview session with job type selection
2. Conduct realistic mock interviews with AI interviewer
3. Use voice recording for answers with real-time transcription
4. Get AI-generated questions based on job type
5. Receive detailed feedback and evaluation scores
6. Review interview history and performance metrics
7. Listen to AI responses using text-to-speech

### API Endpoints for AI Interviewer

#### Interview Management
- **POST /interviews** - Create a new interview session
- **GET /interviews** - Get all interviews
- **GET /interviews/{interview_id}** - Get interview details
- **GET /interviews/user/{username}** - Get user's interviews

#### Chat and Interaction
- **POST /api/chat/{interview_id}** - Send a message
- **GET /api/chat/{interview_id}** - Get chat history
- **POST /interviews/{interview_id}/transcribe** - Transcribe audio
- **POST /interviews/{interview_id}/generate-question** - Generate a new interview question

#### Evaluation and Feedback
- **POST /interviews/{interview_id}/evaluate** - Evaluate response
- **POST /interviews/{interview_id}/evaluate-code** - Evaluate code
- **POST /interviews/{interview_id}/feedback** - Generate interview feedback

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Error message `no pg_hba.conf entry for host` - Make sure you're using `ttadmin` username in your connection string, not `postgres`
   - Verify the connection string in your `.env.local` file matches your AWS RDS instance
   - Check security group settings in AWS RDS to allow connections

2. **Application Errors**:
   - For Next.js errors, check the browser console and terminal
   - For Python script errors, check the log files in `scripts/logs/`

3. **Resume Service Issues**:
   - Ensure the Python environment has all required dependencies
   - Check if the service is running on the correct port

4. **AI Interviewer Issues**:
   - Verify the OpenAI API key is correctly set
   - For Docker issues, ensure Docker and Docker Compose are installed
   - Check MySQL connection details in the docker-compose.yml file

## 📚 API Documentation

### Resume Service API
- **POST /api/customize** - Customize a resume for a specific job
- **GET /api/templates** - Get available resume templates

### Applications API
- **POST /api/applications** - Create a new job application
- **GET /api/applications?userId={id}** - Get all applications for a user
- **GET /api/applications/status?id={id}** - Get application status

### AWS Cognito API
- All authentication is handled through AWS Cognito with the Auth context provider

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgements

- Next.js team for the excellent framework
- Tailwind CSS for the styling utilities
- The PostgreSQL community for the robust database system
- OpenAI for their API services
