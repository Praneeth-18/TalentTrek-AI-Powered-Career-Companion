import { NextResponse } from 'next/server';
import { prisma, getRedactedDatabaseUrl } from '@/lib/db-connector';

// Log that the API is using the centralized connector
console.log(`Applications Status API using database URL: ${getRedactedDatabaseUrl()}`);

// POST handler: Update an application status
export async function POST(req: Request) {
  try {
    // Check if prisma is available
    if (!prisma) {
      console.error('Database connection not available for POST /api/applications/status');
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
          },
          jobListing: {
            select: {
              positionTitle: true,
              company: true,
              location: true,
              jobCategory: true,
            }
          }
        }
      });
      
      console.log(`Application ${applicationId} updated successfully to ${newStatus}`);
      
      // Transform the result to match the expected format in the ApplicationsList component
      const transformedApplication = {
        application_id: updatedApplication.id,
        user_id: updatedApplication.userId,
        job_listing_id: updatedApplication.jobListingId,
        position_title: updatedApplication.jobListing?.positionTitle || 'Unknown Position',
        company: updatedApplication.jobListing?.company || 'Unknown Company',
        location: updatedApplication.jobListing?.location,
        job_category: updatedApplication.jobListing?.jobCategory,
        current_status: updatedApplication.currentStatus,
        applied_at: updatedApplication.appliedAt.toISOString(),
        updated_at: updatedApplication.updatedAt.toISOString(),
        notes: updatedApplication.notes,
        status_history: updatedApplication.statusHistory.map(hist => ({
          id: hist.id,
          status: hist.status,
          changed_at: hist.changedAt.toISOString(),
          notes: hist.notes,
        }))
      };
      
      // Add no-cache headers to ensure the response isn't cached
      const headers = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      };
      
      return NextResponse.json({
        success: true,
        application: transformedApplication
      }, { headers });
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