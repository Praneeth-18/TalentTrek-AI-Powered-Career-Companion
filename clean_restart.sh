#!/bin/bash
echo "Cleaning Next.js cache..."
rm -rf .next

echo "Removing record_application function from database (we'll use direct SQL now)..."
psql postgresql://saipraneethkonuri@localhost:5432/joblistingsportal -c "DROP FUNCTION IF EXISTS record_application(integer, character varying, character varying, text);"

echo "Running database migrations..."
psql postgresql://saipraneethkonuri@localhost:5432/joblistingsportal -f src/db/migrations/05_create_user_job_interactions.sql

echo "Starting application..."
npm run dev 