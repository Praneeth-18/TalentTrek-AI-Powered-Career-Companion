import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Configure environment variables
dotenv.config({ path: '.env.local' });

async function removeResumeFields() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting removal of resume fields from users table...');

    // Check current structure
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current users table structure:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    // Remove resume-related columns if they exist
    const hasResumeText = columnsResult.rows.some(col => col.column_name === 'resume_text');
    const hasResumeUpdatedAt = columnsResult.rows.some(col => col.column_name === 'resume_updated_at');
    const hasResumeEmbedding = columnsResult.rows.some(col => col.column_name === 'resume_embedding');
    
    if (hasResumeText) {
      console.log('Dropping resume_text column...');
      await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS resume_text');
    }
    
    if (hasResumeUpdatedAt) {
      console.log('Dropping resume_updated_at column...');
      await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS resume_updated_at');
    }
    
    if (hasResumeEmbedding) {
      console.log('Dropping resume_embedding column...');
      await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS resume_embedding');
    }
    
    // Update the database function
    console.log('Updating record_application function...');
    const sqlFilePath = path.join(process.cwd(), 'record_application.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    await pool.query(sqlContent);
    
    // Check updated structure
    const updatedColumnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Updated users table structure:');
    updatedColumnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    console.log('Resume fields removal completed successfully!');
  } catch (error) {
    console.error('Error removing resume fields:', error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

removeResumeFields().catch(console.error); 