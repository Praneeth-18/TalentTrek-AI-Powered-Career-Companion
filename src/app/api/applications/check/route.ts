import { NextResponse } from 'next/server';
import { prisma, getRedactedDatabaseUrl } from '@/lib/db-connector';

// Log that the API is using the centralized connector
console.log(`Applications Check API using database URL: ${getRedactedDatabaseUrl()}`);

export async function GET(req: Request) {
  try {
    // Check if prisma is available (should always be in server components)
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    // Extract jobId and userId from query parameters
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    const userId = url.searchParams.get('userId');
    
    if (!jobId || !userId) {
      return NextResponse.json(
        { error: 'Job ID and User ID are required' },
        { status: 400 }
      );
    }

    console.log(`Checking if user ${userId} has applied to job ${jobId}`);

    // Define no-cache headers for user-specific data
    const noCacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };

    // First check the user_applications table (formal applications)
    const application = await prisma.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*) as count
      FROM user_applications
      WHERE job_listing_id = ${parseInt(jobId)}
      AND user_id = ${userId}
    `;
    
    // Parse the count result (SQL returns a string)
    const appCount = parseInt(application[0]?.count || '0');
    
    if (appCount > 0) {
      // If found in the main applications table, return immediately
      console.log(`Found application in user_applications table for user ${userId} and job ${jobId}`);
      return NextResponse.json({
        hasApplied: true,
        applicationCount: appCount,
        source: 'user_applications'
      }, { headers: noCacheHeaders });
    }
    
    // If not found in applications table, also check the interactions table
    const interaction = await prisma.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*) as count
      FROM user_job_interactions
      WHERE job_listing_id = ${parseInt(jobId)}
      AND user_id = ${userId}
      AND interaction_type = 'applied'
    `;
    
    // Parse the interaction count
    const interactionCount = parseInt(interaction[0]?.count || '0');
    
    const hasApplied = appCount > 0 || interactionCount > 0;
    console.log(`Application check result for user ${userId} and job ${jobId}: hasApplied=${hasApplied}`);
    
    // Return the combined result
    return NextResponse.json({
      hasApplied,
      applicationCount: appCount,
      interactionCount,
      source: interactionCount > 0 ? 'user_job_interactions' : 'none'
    }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: 'Failed to check application status', hasApplied: false },
      { status: 500 }
    );
  }
} 