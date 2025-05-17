import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Configure environment variables
dotenv.config({ path: '.env.local' });

async function finalizeSchemaUpdate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting schema verification and finalization...');

    // Check current users table structure
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

    // Verify resume fields removal
    const hasResumeText = columnsResult.rows.some(col => col.column_name === 'resume_text');
    const hasResumeUpdatedAt = columnsResult.rows.some(col => col.column_name === 'resume_updated_at');
    const hasResumeEmbedding = columnsResult.rows.some(col => col.column_name === 'resume_embedding');
    
    if (hasResumeText || hasResumeUpdatedAt || hasResumeEmbedding) {
      console.log('Warning: Some resume fields still exist in the users table. Removing them...');
      
      if (hasResumeText) {
        await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS resume_text');
      }
      
      if (hasResumeUpdatedAt) {
        await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS resume_updated_at');
      }
      
      if (hasResumeEmbedding) {
        await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS resume_embedding');
      }
    } else {
      console.log('Resume fields successfully removed.');
    }

    // Check if username field exists
    const hasUsername = columnsResult.rows.some(col => col.column_name === 'username');
    if (hasUsername) {
      console.log('Warning: username column still exists. Removing it...');
      await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS username');
    }

    // Check record_application function
    console.log('Checking record_application function...');
    const funcResult = await pool.query(`
      SELECT pg_get_functiondef(oid) as func_def
      FROM pg_proc
      WHERE proname = 'record_application';
    `);

    if (funcResult.rows.length === 0) {
      console.log('record_application function not found. Creating it...');
      // Create the function
      const sqlContent = fs.readFileSync(path.join(process.cwd(), 'record_application.sql'), 'utf8');
      await pool.query(sqlContent);
    } else {
      console.log('Updating record_application function to ensure correct signature...');
      const sqlContent = fs.readFileSync(path.join(process.cwd(), 'record_application.sql'), 'utf8');
      await pool.query(sqlContent);
    }

    // Verify the function after update
    const updatedFuncResult = await pool.query(`
      SELECT pg_get_functiondef(oid) as func_def
      FROM pg_proc
      WHERE proname = 'record_application';
    `);
    
    console.log('Updated record_application function:');
    console.log(updatedFuncResult.rows[0]?.func_def);

    console.log('Schema update and verification completed successfully!');
  } catch (error) {
    console.error('Error finalizing schema update:', error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

finalizeSchemaUpdate().catch(console.error); 