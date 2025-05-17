#!/bin/bash

# Script to run fetch_actual_links.js with AWS RDS connection

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========== Fetch Actual Links Setup ==========${NC}"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install it and try again.${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}Error: .env.local file not found. Please create it with DATABASE_URL set.${NC}"
    exit 1
fi

# Export environment variables from .env.local
echo -e "${BLUE}Loading environment variables from .env.local...${NC}"
export $(grep -v '^#' .env.local | xargs)

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL is not set in .env.local. Please add it.${NC}"
    exit 1
fi

echo -e "${GREEN}Using database: $(echo $DATABASE_URL | sed 's/\/\/[^:]*:[^@]*@/\/\/******:******@/')${NC}"

# Install required packages
echo -e "${BLUE}Installing required packages...${NC}"
npm install puppeteer pg dotenv

# Run the fetch_actual_links.js script
echo -e "${BLUE}Running fetch_actual_links.js...${NC}"
node scripts/fetch_actual_links.js

echo -e "${GREEN}Fetch actual links process completed.${NC}" 