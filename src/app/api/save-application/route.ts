import { NextResponse } from 'next/server';
import { prisma, getRedactedDatabaseUrl } from '@/lib/db-connector';

// Log that the API is using the centralized connector
console.log(`Save Application API using database URL: ${getRedactedDatabaseUrl()}`);

// POST handler: Create a new job application
export async function POST(req: Request) {
  try {
    // Check if prisma is available (should always be in server components)
    if (!prisma) {
      console.error('Database connection not available for POST /api/save-application');
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const body = await req.json();
    const { jobListingId, userId, recordInteraction = false } = body;
    
    console.log(`Processing application at save-application endpoint for user ${userId} and job ${jobListingId}`);
    
    if (!jobListingId || !userId) {
      return NextResponse.json(
        { error: 'Job ID and User ID are required' },
        { status: 400 }
      );
    }
    
    try {
      // Check if user exists using direct query instead of model
      console.log(`Checking if user ${userId} exists`);
      const userQuery = await prisma.$queryRaw`
        SELECT id FROM users WHERE id = ${userId}
      `;

      if (!Array.isArray(userQuery) || userQuery.length === 0) {
        console.error(`User not found: ${userId}`);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Check if job exists using direct query
      console.log(`Checking if job ${jobListingId} exists`);
      const jobQuery = await prisma.$queryRaw`
        SELECT id FROM job_listings WHERE id = ${jobListingId}
      `;

      if (!Array.isArray(jobQuery) || jobQuery.length === 0) {
        console.error(`Job listing not found: ${jobListingId}`);
        return NextResponse.json(
          { error: 'Job listing not found' },
          { status: 404 }
        );
      }
      
      // First, record the interaction in userJobInteractions table if requested
      if (recordInteraction) {
        try {
          console.log(`Recording interaction for user ${userId} and job ${jobListingId}`);
          // Use the raw query approach since we don't have direct Prisma model for this
          await prisma.$executeRaw`
            INSERT INTO user_job_interactions (user_id, job_listing_id, interaction_type, created_at, updated_at)
            VALUES (${userId}, ${jobListingId}, 'applied', NOW(), NOW())
            ON CONFLICT (user_id, job_listing_id, interaction_type) 
            DO UPDATE SET updated_at = NOW()
          `;
          console.log('Interaction recorded successfully');
        } catch (interactionError) {
          console.error('Error recording interaction:', interactionError);
          // Continue anyway, since the interaction is optional
        }
      }
      
      // Then, create or update the application record
      try {
        console.log(`Creating or updating application record for user ${userId} and job ${jobListingId}`);
        const parsedJobId = typeof jobListingId === 'string' ? parseInt(jobListingId) : jobListingId;
        
        const application = await prisma.userApplication.upsert({
          where: {
            jobListingId_userId: {
              jobListingId: parsedJobId,
              userId: userId
            }
          },
          update: {
            // Just update the timestamp if it already exists
            updatedAt: new Date()
          },
          create: {
            jobListingId: parsedJobId,
            userId: userId,
            currentStatus: 'Applied',
            appliedAt: new Date(),
            statusHistory: {
              create: {
                status: 'Applied',
                notes: 'Initial application'
              }
            }
          }
        });
        
        console.log(`Application recorded successfully with ID ${application.id}`);
        return NextResponse.json({
          success: true,
          applicationId: application.id,
          message: 'Application recorded successfully'
        });
      } catch (error: any) {
        // Check for unique constraint violation
        if (error.code === 'P2002') {
          console.log(`Already applied to job ${jobListingId}`);
          return NextResponse.json(
            { message: 'Already applied to this job' },
            { status: 409 }
          );
        }
        
        throw error;
      }
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
} 