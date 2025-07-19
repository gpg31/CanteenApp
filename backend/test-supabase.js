const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    // Test query using Supabase client
    const { data, error } = await supabase
      .from('users')  // Replace with any table name in your database
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('Successfully connected to Supabase!');
    console.log('\nQuery result:', data);

  } catch (error) {
    console.error('Database connection error:', error);
  }
}

// Run the test
console.log('Testing Supabase connection...');
testConnection();
