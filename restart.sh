#!/bin/bash
echo "Cleaning Next.js cache..."
rm -rf .next

echo "Restarting application..."
npm run dev 