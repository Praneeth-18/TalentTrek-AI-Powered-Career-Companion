import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize a fresh Prisma client
const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Extract jobId from query parameters
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get the job listing from the database
    const jobListing = await prisma.jobListing.findUnique({
      where: {
        id: parseInt(jobId)
      }
    });
    
    if (!jobListing) {
      return NextResponse.json(
        { error: 'Job listing not found' },
        { status: 404 }
      );
    }

    // Check for the apply link - try actual_apply_link first, then fall back to applyLink
    // We access the fields directly to avoid TypeScript errors since the schema might be different
    const redirectUrl = (jobListing as any).actual_apply_link || jobListing.applyLink;
    
    if (!redirectUrl) {
      return NextResponse.json(
        { error: 'No apply link available for this job' },
        { status: 404 }
      );
    }

    // Create a redirect response
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error redirecting to job apply link:', error);
    return NextResponse.json(
      { error: 'Failed to redirect to job apply link' },
      { status: 500 }
    );
  }
} 