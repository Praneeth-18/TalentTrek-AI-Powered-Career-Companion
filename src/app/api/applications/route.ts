import { NextResponse } from 'next/server';
import { prisma, getRedactedDatabaseUrl } from '@/lib/db-connector';

// Log that the API is using the centralized connector
console.log(`Applications API using database URL: ${getRedactedDatabaseUrl()}`);

// POST handler: Create a new job application
export async function POST(req: Request) {
  try {
    // Check if prisma is available (should always be in server components)
    if (!prisma) {
      console.error('Database connection not available for POST /api/applications');
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const body = await req.json();
    const { jobListingId, userId, recordInteraction = false } = body;
    
    console.log(`Processing application for user ${userId} and job ${jobListingId}`);
    
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

// GET handler: Get applications for a user or job
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
    
    // Define no-cache headers for user-specific data
    const noCacheHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };
    
    // Handle different query scenarios
    if (userId && jobId) {
      // Get specific application
      const application = await prisma.userApplication.findUnique({
        where: {
          jobListingId_userId: {
            jobListingId: parseInt(jobId),
            userId: userId
          }
        },
        include: {
          jobListing: {
            select: {
              positionTitle: true,
              company: true
            }
          },
          statusHistory: true
        }
      });
      
      if (!application) {
        return NextResponse.json(
          { message: 'No application found' },
          { status: 404, headers: noCacheHeaders }
        );
      }
      
      return NextResponse.json(application, { headers: noCacheHeaders });
    } else if (userId) {
      // Get all applications for a user
      try {
        const applications = await prisma.userApplication.findMany({
          where: {
            userId: userId
          },
          include: {
            jobListing: {
              select: {
                positionTitle: true,
                company: true,
                location: true,
                jobCategory: true,
              }
            },
            statusHistory: {
              orderBy: {
                changedAt: 'desc'
              }
            }
          },
          orderBy: {
            appliedAt: 'desc'
          }
        });
        
        // Transform the results to match the expected format
        const transformedApplications = applications.map(app => ({
          application_id: app.id,
          user_id: app.userId,
          job_listing_id: app.jobListingId,
          position_title: app.jobListing?.positionTitle || 'Unknown Position',
          company: app.jobListing?.company || 'Unknown Company',
          location: app.jobListing?.location,
          job_category: app.jobListing?.jobCategory,
          current_status: app.currentStatus,
          applied_at: app.appliedAt.toISOString(),
          updated_at: app.updatedAt.toISOString(),
          notes: app.notes,
          status_history: app.statusHistory.map(hist => ({
            id: hist.id,
            status: hist.status,
            changed_at: hist.changedAt.toISOString(),
            notes: hist.notes,
          }))
        }));
        
        return NextResponse.json({
          userId,
          applications: transformedApplications
        }, { headers: noCacheHeaders });
      } catch (error) {
        console.error('Error transforming applications data:', error);
        return NextResponse.json({
          userId,
          applications: []
        }, { headers: noCacheHeaders });
      }
    } else if (jobId) {
      // Get all applications for a job
      const applications = await prisma.userApplication.findMany({
        where: {
          jobListingId: parseInt(jobId)
        },
        include: {
          statusHistory: true
        },
        orderBy: {
          appliedAt: 'desc'
        }
      });
      
      return NextResponse.json({
        jobId,
        applications
      }, { headers: noCacheHeaders });
    } else {
      return NextResponse.json(
        { error: 'Either userId or jobId is required' },
        { status: 400, headers: noCacheHeaders }
      );
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// PUT handler: Update an existing application (e.g., change status)
export async function PUT(req: Request) {
  try {
    // Check if prisma is available
    if (!prisma) {
      console.error('Database connection not available for PUT /api/applications');
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const body = await req.json();
    const { applicationId, newStatus, notes } = body;
    
    console.log(`Updating application ${applicationId} to status: ${newStatus}`);
    
    if (!applicationId || !newStatus) {
      return NextResponse.json(
        { error: 'Application ID and new status are required' },
        { status: 400 }
      );
    }
    
    try {
      // First, create a new status history entry
      const statusHistoryEntry = await prisma.applicationStatusHistory.create({
        data: {
          userApplicationId: parseInt(applicationId),
          status: newStatus,
          changedAt: new Date(),
          notes: notes || `Status changed to ${newStatus}`
        }
      });
      
      // Then update the main application record
      const updatedApplication = await prisma.userApplication.update({
        where: {
          id: parseInt(applicationId)
        },
        data: {
          currentStatus: newStatus,
          updatedAt: new Date(),
          notes: notes || undefined
        },
        include: {
          statusHistory: {
            orderBy: {
              changedAt: 'desc'
            }
          }
        }
      });
      
      console.log(`Application ${applicationId} updated successfully to ${newStatus}`);
      
      return NextResponse.json({
        success: true,
        application: updatedApplication
      });
    } catch (dbError) {
      console.error('Database error updating application:', dbError);
      return NextResponse.json(
        { error: 'Failed to update application status', details: String(dbError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
} 