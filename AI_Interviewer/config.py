import os
from dotenv import load_dotenv

load_dotenv()

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', 'key')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4')
OPENAI_TEMPERATURE = float(os.getenv('OPENAI_TEMPERATURE', '0.7'))
OPENAI_MAX_TOKENS = int(os.getenv('OPENAI_MAX_TOKENS', '2000'))

# Database Configuration
MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST'+'?ssl_disabled=True', 'mysql.cnywg6k8i5eu.us-east-2.rds.amazonaws.com'),
    'user': os.getenv('MYSQL_USER', 'admin'),
    'password': os.getenv('MYSQL_PASSWORD', 'Pass'),
    'database': os.getenv('MYSQL_DATABASE', 'mock_interview_platform'),
    'port': int(os.getenv('MYSQL_PORT', '3306'))
}

# AWS Configuration for local DynamoDB
AWS_CONFIG = {
    'region': 'us-east-2',
    'dynamodb_endpoint': 'http://localhost:8000',
    'aws_access_key_id': 'access',
    'aws_secret_access_key': 'secret',
    'environment': 'prod'
}

# Interview Types
INTERVIEW_TYPES = [
    'TECHNICAL',
    'FRONTEND',
    'BACKEND',
    'FULLSTACK',
    'SYSTEM_DESIGN',
    'DATA_SCIENCE',
    'MACHINE_LEARNING',
    'DEVOPS',
    'MOBILE'
]

# Interview Phases
INTERVIEW_PHASES = [
    'PROBLEM_EXPLANATION',
    'APPROACH_VALIDATION',
    'CODE_IMPLEMENTATION',
    'CODE_VALIDATION',
    'COMPLETED'
]

# Interview Status
INTERVIEW_STATUS = [
    'in_progress',
    'completed',
    'cancelled'
]

# Assessment Types
ASSESSMENT_TYPES = [
    'strength',
    'improvement'
]

# Rate Limiting
RATE_LIMIT = {
    'requests_per_minute': 3,
    'timeout_seconds': 30
}

# Retry Configuration
RETRY_CONFIG = {
    'max_attempts': 3,
    'wait_seconds': 2
}