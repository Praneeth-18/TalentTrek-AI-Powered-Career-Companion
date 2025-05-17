#!/bin/bash

# Script to set up and run the Next.js web application with auth integration

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========== Job Portal Web App with Authentication Setup ==========${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install it and try again.${NC}"
    exit 1
fi

echo -e "${BLUE}Installing npm dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install npm dependencies. Exiting.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed successfully.${NC}"

# Kill any existing processes on ports 3000-3009
echo -e "${BLUE}Killing any existing processes on ports 3000-3009...${NC}"
for port in {3000..3009}; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
echo -e "${GREEN}Ports cleared.${NC}"

# Make sure resume-service is running in background
echo -e "${BLUE}Setting up resume service in the background...${NC}"
cd resume-service/backend

# Check if Python 3.11 virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${BLUE}Creating Python 3.11 virtual environment...${NC}"
    python3.11 -m venv .venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create virtual environment. Please ensure Python 3.11 is installed.${NC}"
        cd ../..
        exit 1
    fi
fi

# Activate virtual environment and install requirements
echo -e "${BLUE}Activating virtual environment and installing requirements...${NC}"
source .venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Python requirements. Exiting.${NC}"
    cd ../..
    exit 1
fi

# Start the resume service in the background
echo -e "${BLUE}Starting the resume service in the background...${NC}"
python -m uvicorn main:app --reload --port 8000 &
RESUME_SERVICE_PID=$!
echo -e "${GREEN}Resume service started with PID: ${RESUME_SERVICE_PID}${NC}"

# Go back to main directory
cd ../..

# Run the Next.js development server
echo -e "${BLUE}Starting the Next.js development server...${NC}"
echo -e "${GREEN}The application will be available at http://localhost:3000${NC}"
echo -e "${GREEN}Use the following credentials for testing:${NC}"
echo -e "${GREEN}Email: test@example.com${NC}"
echo -e "${GREEN}Password: password${NC}"

npm run dev

# Cleanup on exit
kill $RESUME_SERVICE_PID 2>/dev/null || true 