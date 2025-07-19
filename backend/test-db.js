const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    // Try to connect and run a simple query
    const client = await pool.connect();
    console.log('Successfully connected to the database!');

    // Test query to get PostgreSQL version
    const result = await client.query('SELECT version();');
    console.log('PostgreSQL Version:', result.rows[0].version);

    // List all tables in the public schema
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nAvailable tables:');
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the test
console.log('Testing database connection...');
testConnection();
