import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, getRedactedDatabaseUrl } from '@/lib/db-connector';

// Log that the API is using the centralized connector
console.log(`Interactions API using database URL: ${getRedactedDatabaseUrl()}`);

// Define valid interaction types
const VALID_INTERACTION_TYPES = ['viewed', 'applied', 'declined', 'saved'];

// POST: Record a new interaction
export async function POST(req: Request) {
  try {
    // Check if prisma is available (should always be in server components)
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const body = await req.json();
    const { userId, jobId, interactionType } = body;
    
    if (!userId || !jobId || !interactionType) {
      return NextResponse.json(
        { error: 'User ID, Job ID, and interaction type are all required' },
        { status: 400 }
      );
    }
    
    // Validate interaction type
    if (!VALID_INTERACTION_TYPES.includes(interactionType)) {
      return NextResponse.json(
        { error: `Invalid interaction type. Must be one of: ${VALID_INTERACTION_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Record the interaction using the database function
    const result = await prisma.$queryRaw`
      SELECT track_job_interaction(
        ${String(userId)}::VARCHAR(255), 
        ${Number(jobId)}::INTEGER, 
        ${interactionType}::VARCHAR(50)
      ) as id
    `;
    
    const interactionId = Array.isArray(result) && result.length > 0 ? result[0].id : null;
    
    return NextResponse.json({
      success: true,
      interactionId,
      message: `Interaction '${interactionType}' recorded successfully`
    });
  } catch (error) {
    console.error('Error recording job interaction:', error);
    return NextResponse.json(
      { error: 'Failed to record job interaction' },
      { status: 500 }
    );
  }
}

// GET: Check user interactions with a job
export async function GET(req: Request) {
  try {
    // Check if prisma is available (should always be in server components)
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');
    const interactionType = searchParams.get('type');
    const batchIds = searchParams.get('batchIds'); // New parameter for batch processing
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // NEW: Handle batch processing of multiple job IDs
    if (batchIds) {
      const jobIdList = batchIds.split(',').map(id => parseInt(id, 10));
      
      // Skip any invalid IDs
      const validIds = jobIdList.filter(id => !isNaN(id));
      
      if (validIds.length === 0) {
        return NextResponse.json({ interactions: {} });
      }
      
      try {
        // Get interactions for all requested job IDs in a single query
        const batchInteractions = await prisma.$queryRaw`
          SELECT job_listing_id, interaction_type, created_at
          FROM user_job_interactions
          WHERE user_id = ${userId}
          ${interactionType ? Prisma.sql`AND interaction_type = ${interactionType}` : Prisma.empty}
          AND job_listing_id IN (${Prisma.join(validIds)})
          ORDER BY created_at DESC
        `;
        
        // Process results into a map of jobId -> interactions
        const interactionsMap: Record<number, any[]> = {};
        validIds.forEach(id => {
          interactionsMap[id] = [];
        });
        
        (batchInteractions as any[]).forEach((interaction: any) => {
          const jobListingId = interaction.job_listing_id;
          if (interactionsMap[jobListingId]) {
            interactionsMap[jobListingId].push({
              interaction_type: interaction.interaction_type,
              created_at: interaction.created_at
            });
          }
        });
        
        console.log(`Fetched interactions for ${validIds.length} jobs in a single query`);
        return NextResponse.json({ interactions: interactionsMap });
      } catch (error) {
        console.error('Error in batch interactions query:', error);
        return NextResponse.json(
          { error: 'Failed to fetch batch job interactions' },
          { status: 500 }
        );
      }
    }
    
    // If jobId is provided, get interactions for a specific job
    if (jobId) {
      // Use proper Prisma raw query parameters instead of string interpolation
      const jobIdNum = parseInt(jobId);
      
      if (interactionType) {
        // Query with both job ID and interaction type
        const interactions = await prisma.$queryRaw`
          SELECT interaction_type, created_at
          FROM user_job_interactions
          WHERE user_id = ${userId}
          AND job_listing_id = ${jobIdNum}
          AND interaction_type = ${interactionType}
          ORDER BY created_at DESC
        `;
        
        return NextResponse.json({
          job_id: jobId,
          user_id: userId,
          interactions: interactions || []
        });
      } else {
        // Query with just job ID
        const interactions = await prisma.$queryRaw`
          SELECT interaction_type, created_at
          FROM user_job_interactions
          WHERE user_id = ${userId}
          AND job_listing_id = ${jobIdNum}
          ORDER BY created_at DESC
        `;
        
        return NextResponse.json({
          job_id: jobId,
          user_id: userId,
          interactions: interactions || []
        });
      }
    }
    
    // Otherwise, get all interactions for a user, optionally filtered by type
    if (interactionType) {
      // Get all interactions of a specific type for this user
      const interactions = await prisma.$queryRaw`
        SELECT job_listing_id, interaction_type, MAX(created_at) as latest_interaction
        FROM user_job_interactions
        WHERE user_id = ${userId}
        AND interaction_type = ${interactionType}
        GROUP BY job_listing_id, interaction_type
        ORDER BY latest_interaction DESC
      `;
      
      return NextResponse.json({
        user_id: userId,
        interactions: interactions || []
      });
    } else {
      // Get all interactions for this user
      const interactions = await prisma.$queryRaw`
        SELECT job_listing_id, interaction_type, MAX(created_at) as latest_interaction
        FROM user_job_interactions
        WHERE user_id = ${userId}
        GROUP BY job_listing_id, interaction_type
        ORDER BY latest_interaction DESC
      `;
      
      return NextResponse.json({
        user_id: userId,
        interactions: interactions || []
      });
    }
  } catch (error) {
    console.error('Error fetching job interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job interactions' },
      { status: 500 }
    );
  }
} 