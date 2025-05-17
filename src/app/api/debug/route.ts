import { NextResponse } from 'next/server';
import { prisma, getRedactedDatabaseUrl, testDatabaseConnection } from '@/lib/db-connector';

export async function GET(req: Request) {
  try {
    // Test the database connection
    const dbUrl = getRedactedDatabaseUrl();
    const connectionTest = await testDatabaseConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: connectionTest.message,
        databaseUrl: dbUrl,
        error: connectionTest.error
      });
    }
    
    // Try to query a simple count
    try {
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) FROM users`;
      const jobCount = await prisma.$queryRaw`SELECT COUNT(*) FROM job_listings`;
      const applicationCount = await prisma.$queryRaw`SELECT COUNT(*) FROM user_applications`;
      
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        databaseUrl: dbUrl,
        counts: {
          users: userCount,
          jobs: jobCount,
          applications: applicationCount
        }
      });
    } catch (queryError: any) {
      return NextResponse.json({
        success: false,
        message: 'Database query failed',
        databaseUrl: dbUrl,
        error: queryError.message || 'Unknown error'
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message || 'Unknown error'
    });
  }
} 