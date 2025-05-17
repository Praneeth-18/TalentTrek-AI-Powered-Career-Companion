/**
 * Centralized database connector for the entire application 
 * This ensures consistent connections across all database operations
 */
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Get the database URL and fix username for AWS RDS
const dbUrl = process.env.DATABASE_URL || '';

// Enhanced pattern replacement for more reliable connections
// Handle all possible PostgreSQL URL formats and user patterns
// This fixes issues with AWS RDS connectivity
const correctedDbUrl = dbUrl
  // Handle standard postgres:// format
  .replace(/postgres:\/\/postgres:/g, 'postgres://ttadmin:')
  .replace(/postgres:\/\/postgres@/g, 'postgres://ttadmin@')
  // Handle standard postgresql:// format
  .replace(/postgresql:\/\/postgres:/g, 'postgresql://ttadmin:')
  .replace(/postgresql:\/\/postgres@/g, 'postgresql://ttadmin@')
  // Also handle cases where the username might be just 'postgres' without explicit protocol
  .replace(/:\/\/postgres@/g, '://ttadmin@')
  // Handle any other potential variations
  .replace(/:\/\/postgres\:/g, '://ttadmin:')
  // Handle cases with no colon after postgres
  .replace(/:\/\/postgres\//g, '://ttadmin/')
  // Generic replacement for any remaining instances
  .replace(/([a-z]+):\/\/postgres([^a-z])/g, '$1://ttadmin$2');

// Log the connection pattern (without credentials)
const maskedDbUrl = correctedDbUrl.replace(/\/\/[^:]+:[^@]+@/, '//******:******@');
console.log(`Database connector using: ${maskedDbUrl}`);

// Prisma Setup
// Create a variable to reuse the same prisma instance across hot reloads in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Initialize Prisma Client only on the server side
export const prisma = globalForPrisma.prisma || (typeof window === 'undefined' ? 
  new PrismaClient({
    datasources: {
      db: {
        url: correctedDbUrl
      },
    },
    log: ['error', 'warn']
  }) : null);

// Save the client in development to avoid multiple instances
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
}

// Pool Setup for pg direct queries
// Parse connection details with SSL config
const connectionDetails = {
  connectionString: correctedDbUrl,
  ssl: { 
    rejectUnauthorized: false,
    // Add additional SSL options to improve connection reliability
    sslmode: 'require'
  },
  // Improve connection reliability with timeouts
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
};

// Create the pool (only on server)
export const pgPool = typeof window === 'undefined' 
  ? new Pool(connectionDetails)
  : null;

// For debugging connections
pgPool?.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// For getting a redacted database URL (for logging)
export function getRedactedDatabaseUrl() {
  return maskedDbUrl;
}

// For testing database connectivity
export async function testDatabaseConnection() {
  try {
    if (!prisma) {
      return { success: false, message: 'Prisma client not available' };
    }
    
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) FROM users`;
    return { 
      success: true, 
      message: 'Database connection successful',
      userCount
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: 'Database connection failed',
      error: error.message || String(error)
    };
  }
} 