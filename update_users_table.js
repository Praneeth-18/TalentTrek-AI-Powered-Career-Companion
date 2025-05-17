import { Pool } from 'pg';
import dotenv from 'dotenv';

// Configure environment variables
dotenv.config({ path: '.env.local' });

async function updateUsersTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting users table update...');

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

    // Update the database schema to match our Prisma schema
    console.log('Updating users table...');
    
    // 1. Check if username column exists but we don't need it anymore
    const hasUsername = columnsResult.rows.some(col => col.column_name === 'username');
    if (hasUsername) {
      console.log('Dropping username column...');
      await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS username');
    }
    
    // 2. Check if first_name and last_name columns exist but need to be consolidated
    const hasFirstName = columnsResult.rows.some(col => col.column_name === 'first_name');
    const hasLastName = columnsResult.rows.some(col => col.column_name === 'last_name');
    
    if (hasFirstName && hasLastName && !columnsResult.rows.some(col => col.column_name === 'name')) {
      console.log('Converting first_name and last_name to name...');
      
      // Add name column
      await pool.query('ALTER TABLE users ADD COLUMN name TEXT');
      
      // Update name using concatenation of first_name and last_name
      await pool.query(`
        UPDATE users 
        SET name = CONCAT(first_name, ' ', last_name)
      `);
      
      // Drop old columns
      await pool.query('ALTER TABLE users DROP COLUMN first_name');
      await pool.query('ALTER TABLE users DROP COLUMN last_name');
    }
    
    // 3. Make sure name column exists
    if (!columnsResult.rows.some(col => col.column_name === 'name')) {
      console.log('Adding name column...');
      await pool.query('ALTER TABLE users ADD COLUMN name TEXT');
    }
    
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

    console.log('Users table update completed successfully!');
  } catch (error) {
    console.error('Error updating users table:', error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

updateUsersTable().catch(console.error); 