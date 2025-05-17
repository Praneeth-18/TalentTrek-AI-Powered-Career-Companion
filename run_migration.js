import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure environment variables
dotenv.config({ path: '.env.local' });

// Get current file and directory paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting database migration script...');
require('dotenv').config();

// Fix DATABASE_URL if needed
let dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Replace postgres user with ttadmin for AWS RDS
dbUrl = dbUrl
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

// Create a masked URL for logging
const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//******:******@');
console.log(`Using database: ${maskedUrl}`);

// Create a connection pool
const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    // Instead of running the full migration file, we'll execute each part separately
    console.log('Running database migration in parts...');
    
    // Check the structure of the users table
    try {
      const usersSchema = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      
      console.log('Users table structure:');
      usersSchema.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } catch (error) {
      console.error('Error checking users table structure:', error);
    }
    
    // Check the structure of user_applications table
    try {
      const appSchema = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_applications'
        ORDER BY ordinal_position;
      `);
      
      console.log('User applications table structure:');
      appSchema.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } catch (error) {
      console.error('Error checking applications table structure:', error);
    }
    
    // Update user_applications table
    try {
      await pool.query(`
        ALTER TABLE user_applications 
        ALTER COLUMN user_id TYPE VARCHAR(255);
      `);
      console.log('User applications table updated.');
    } catch (error) {
      console.error('Error updating user_applications table:', error);
    }
    
    // Remove resume_data column if it exists
    try {
      await pool.query(`
        ALTER TABLE user_applications 
        DROP COLUMN IF EXISTS resume_data;
      `);
      console.log('Removed resume_data column from user_applications table.');
    } catch (error) {
      console.error('Error removing resume_data column:', error);
    }
    
    // Create a view to match the actual table structure
    try {
      await pool.query(`
        CREATE OR REPLACE VIEW user_applications_with_history AS
        SELECT 
            ua.id AS application_id,
            u.id AS user_id,
            u.email,
            u.name,
            jl.id AS job_listing_id,
            jl.position_title,
            jl.company,
            jl.location,
            jl.job_category,
            ua.current_status,
            ua.applied_at,
            ua.updated_at,
            ua.notes,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', ash.id,
                    'status', ash.status,
                    'changed_at', ash.changed_at,
                    'notes', ash.notes
                ) ORDER BY ash.changed_at DESC)
                FROM application_status_history ash
                WHERE ash.user_application_id = ua.id),
                '[]'::json
            ) AS status_history
        FROM 
            user_applications ua
        JOIN 
            users u ON ua.user_id = u.id
        JOIN 
            job_listings jl ON ua.job_listing_id = jl.id;
      `);
      console.log('Updated view user_applications_with_history.');
    } catch (error) {
      console.error('Error creating view:', error);
    }
    
    // Drop the old function first then create a new one
    try {
      await pool.query(`
        DROP FUNCTION IF EXISTS record_application(INTEGER, VARCHAR, VARCHAR, TEXT, TEXT);
        DROP FUNCTION IF EXISTS record_application(INTEGER, VARCHAR, VARCHAR, TEXT);
      `);
      console.log("Dropped old record_application functions.");
    } catch (dropError) {
      console.error("Error dropping function:", dropError);
    }
    
    // Update record_application function to match the current table structure
    console.log("Creating record_application function...");
    try {
      await pool.query(`
        CREATE OR REPLACE FUNCTION record_application(
          p_job_listing_id INTEGER, 
          p_user_id VARCHAR(255), 
          p_status VARCHAR(50) DEFAULT 'Applied',
          p_notes TEXT DEFAULT NULL
        )
        RETURNS INTEGER AS $$
        DECLARE
          v_application_id INTEGER;
        BEGIN
          -- Check if user exists
          IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
            RAISE EXCEPTION 'User with ID % not found', p_user_id;
          END IF;
          
          -- Check if application already exists
          SELECT id INTO v_application_id 
          FROM user_applications 
          WHERE job_listing_id = p_job_listing_id AND user_id = p_user_id;
          
          IF v_application_id IS NOT NULL THEN
            RETURN v_application_id; -- Return existing application ID
          END IF;
          
          -- Insert new application
          INSERT INTO user_applications (
            job_listing_id, 
            user_id, 
            current_status, 
            notes,
            applied_at,
            updated_at
          ) VALUES (
            p_job_listing_id,
            p_user_id,
            p_status,
            p_notes,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          ) RETURNING id INTO v_application_id;
          
          -- Add initial status history record
          INSERT INTO application_status_history (
            user_application_id,
            status,
            notes,
            changed_at
          ) VALUES (
            v_application_id,
            p_status,
            p_notes,
            CURRENT_TIMESTAMP
          );
          
          RETURN v_application_id;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log("record_application function created successfully!");
    } catch (funcError) {
      console.error("Error creating record_application function:", funcError);
    }
    
    // Create a test user if it doesn't exist (with name field)
    const testUser = {
      id: 'test-user-id-123',
      email: 'user1@example.com', 
      name: 'Test User'
    };

    // Check if user already exists
    const checkUserResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [testUser.id]
    );

    if (checkUserResult.rows.length === 0) {
      // Create test user
      await pool.query(
        'INSERT INTO users (id, email, name) VALUES ($1, $2, $3)',
        [testUser.id, testUser.email, testUser.name]
      );
      console.log('Test user created!');
    } else {
      console.log('Test user already exists');
    }

    // Output summary
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const appCount = await pool.query('SELECT COUNT(*) FROM user_applications');
    const historyCount = await pool.query('SELECT COUNT(*) FROM application_status_history');
    
    console.log(`Database status:
- Users: ${userCount.rows[0].count}
- Applications: ${appCount.rows[0].count}
- Status history entries: ${historyCount.rows[0].count}
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

runMigration().catch(console.error); 