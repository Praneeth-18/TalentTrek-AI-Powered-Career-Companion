import { PrismaClient } from '@prisma/client';
import { Pool, PoolConfig } from 'pg';

declare global {
  var prisma: PrismaClient | undefined;
}

const dbUrl = process.env.DATABASE_URL || '';

// Replace 'postgres:' with 'ttadmin:' in the connection string if using AWS RDS
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

// Configure SSL for AWS RDS connections
const sslConfig = {
  rejectUnauthorized: false // For development with self-signed certs
};

// Pool configuration
const poolConfig: PoolConfig = {
  connectionString: correctedDbUrl,
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Log connection information (with password redacted)
const redactedUrl = correctedDbUrl.replace(
  /(postgres:\/\/|postgresql:\/\/)([^:]+):([^@]+)@/,
  '$1$2:****@'
);
console.log(`Connecting to database: ${redactedUrl}`);

// Create the Prisma client
const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: correctedDbUrl
    }
  }
});

// Create a connection pool for direct queries
export const pool = new Pool(poolConfig);

// Register error handler
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

// In development, save prisma client on the global object
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma; 