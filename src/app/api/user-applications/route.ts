import { NextResponse } from 'next/server';
import { prisma, getRedactedDatabaseUrl } from '@/lib/db-connector';

// Log that the API is using the centralized connector
console.log(`User Applications API using database URL: ${getRedactedDatabaseUrl()}`);

/**
 * GET: Fetch all applications for a user
 * More efficient than making multiple API calls per job
 */
export async function GET(req: Request) {
  try {
    // Check if prisma is available (should always be in server components)
    if (!prisma) {
      console.error('Database connection not available for GET /api/user-applications');
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    console.log(`Fetching applications for user ${userId}`);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    try {
      // Get all applications for this user in a single query
      const applications = await prisma.userApplication.findMany({
        where: {
          userId: userId
        },
        select: {
          jobListingId: true,
          currentStatus: true,
          appliedAt: true
        }
      });
      
      console.log(`Found ${applications.length} formal applications for user ${userId}`);
      
      // Also get all 'applied' interactions from the interactions table
      // This ensures we catch any applications that might be in one system but not the other
      const interactions = await prisma.$queryRaw`
        SELECT job_listing_id, created_at 
        FROM user_job_interactions
        WHERE user_id = ${userId}
        AND interaction_type = 'applied'
      `;
      
      console.log(`Found ${(interactions as any[]).length} interaction records for user ${userId}`);
      
      // Combine both data sources into a single map for efficient lookups
      const applicationMap = new Map();
      
      // First add all formal applications
      applications.forEach(app => {
        applicationMap.set(app.jobListingId, {
          status: app.currentStatus,
          appliedAt: app.appliedAt
        });
      });
      
      // Then add any interactions that aren't already in the map
      (interactions as any[]).forEach((interaction: { job_listing_id: number, created_at: Date }) => {
        if (!applicationMap.has(interaction.job_listing_id)) {
          applicationMap.set(interaction.job_listing_id, {
            status: 'Applied', // Default status
            appliedAt: interaction.created_at
          });
        }
      });
      
      // Convert map to array for JSON response
      const result = Array.from(applicationMap.entries()).map(([jobId, data]) => ({
        jobId,
        status: data.status,
        appliedAt: data.appliedAt
      }));
      
      console.log(`Returning ${result.length} combined applications for user ${userId}`);
      
      // Define no-cache headers for user-specific data
      const headers = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      };
      
      // Return the combined results with no-cache headers
      return NextResponse.json({
        userId,
        applications: result
      }, { headers });
    } catch (dbError) {
      console.error('Database error when fetching applications:', dbError);
      return NextResponse.json(
        { error: 'Database error when fetching applications', details: String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user applications' },
      { status: 500 }
    );
  }
} 