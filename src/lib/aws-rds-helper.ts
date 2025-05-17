/**
 * Helper utilities for AWS RDS connections
 */

/**
 * Fixes the database URL by replacing postgres user with ttadmin if needed
 * This is specific to the AWS RDS setup where ttadmin is the username
 */
export function getFixedDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Log the original URL (with credentials masked)
  const maskedOriginalUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//******:******@');
  console.log(`Original DB URL pattern: ${maskedOriginalUrl}`);
  
  // Replace postgres user with ttadmin for all variations using regex
  // This handles all possible formats at once
  let correctedDbUrl = dbUrl
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
  
  // Log the corrected URL pattern (with credentials masked)
  const maskedCorrectedUrl = correctedDbUrl.replace(/\/\/[^:]+:[^@]+@/, '//******:******@');
  console.log(`Corrected DB URL pattern: ${maskedCorrectedUrl}`);
  
  return correctedDbUrl;
}

/**
 * Gets a database URL with sensitive information redacted for logging
 */
export function getRedactedDatabaseUrl() {
  const dbUrl = getFixedDatabaseUrl();
  return dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//******:******@');
}

/**
 * Standard SSL configuration for AWS RDS connections
 */
export const rdsSSLConfig = {
  rejectUnauthorized: false, // Disable SSL certificate verification for development
};

/**
 * Default connection pool configuration for AWS RDS
 */
export const rdsPoolConfig = {
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  max: 10,
  ssl: rdsSSLConfig
}; 