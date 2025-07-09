// Console helper functions for Flattenhund debugging and testing
// These functions are available in the browser console for easy testing

// Comprehensive connection diagnostic
window.diagnoseConnection = async function() {
  console.log('🔍 FLATTENHUND CONNECTION DIAGNOSTIC');
  console.log('=====================================');
  
  // Test 1: Check if Supabase library is loaded
  console.log('\n1. Checking Supabase library...');
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase library not loaded!');
    console.log('💡 Check if the Supabase CDN script is loading properly');
    return;
  }
  console.log('✅ Supabase library loaded');
  
  // Test 2: Check if credentials are loaded
  console.log('\n2. Checking credentials...');
  const url = window.SUPABASE_DATABASE_URL || window.NETLIFY_ENV?.SUPABASE_DATABASE_URL;
  const key = window.SUPABASE_ANON_KEY || window.NETLIFY_ENV?.SUPABASE_ANON_KEY;
  
  console.log('URL found:', url ? '✅ Yes' : '❌ No');
  console.log('Key found:', key ? '✅ Yes' : '❌ No');
  
  if (!url || !key) {
    console.error('❌ Missing credentials!');
    console.log('💡 Check js/netlify-env.js for proper configuration');
    return;
  }
  
  console.log('🔗 URL:', url);
  console.log('🔑 Key:', key.substring(0, 20) + '...');
  
  // Test 3: Try to create client
  console.log('\n3. Creating Supabase client...');
  let client;
  try {
    client = supabase.createClient(url, key);
    console.log('✅ Client created successfully');
  } catch (clientError) {
    console.error('❌ Failed to create client:', clientError);
    return;
  }
  
  // Test 4: Test basic connection
  console.log('\n4. Testing basic connection...');
  try {
    const { data, error } = await client.from('leaderboard').select('count');
    if (error) {
      console.error('❌ Database query failed:', error.message);
      
      if (error.message.includes('relation "leaderboard" does not exist')) {
        console.log('💡 The "leaderboard" table needs to be created!');
        console.log('📝 Run this SQL in your Supabase dashboard:');
        console.log(`
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  name VARCHAR(10) NOT NULL,
  score INTEGER NOT NULL,
  character_used VARCHAR(20) DEFAULT 'taz',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable public access (required for the game to work)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the leaderboard
CREATE POLICY "Anyone can read leaderboard" ON leaderboard FOR SELECT USING (true);

-- Allow anyone to insert scores
CREATE POLICY "Anyone can insert scores" ON leaderboard FOR INSERT WITH CHECK (true);
        `);
        return;
      }
      
      if (error.message.includes('JWT')) {
        console.log('💡 Authentication issue - check your anon key');
        return;
      }
      
      console.log('💡 Other database error - check your project status');
      return;
    } else {
      console.log('✅ Database connection successful!');
    }
  } catch (connectionError) {
    console.error('❌ Connection error:', connectionError);
    console.log('💡 This might be a network issue or the project is paused');
    return;
  }
  
  // Test 5: Try to fetch leaderboard data
  console.log('\n5. Testing leaderboard table...');
  try {
    const { data, error } = await client.from('leaderboard').select('*').limit(5);
    if (error) {
      console.error('❌ Leaderboard query failed:', error.message);
      return;
    } else {
      console.log('✅ Leaderboard table accessible!');
      console.log('📊 Current entries:', data.length);
      if (data.length > 0) {
        console.log('📊 Sample data:', data);
      }
    }
  } catch (tableError) {
    console.error('❌ Table access failed:', tableError);
    return;
  }
  
  // Test 6: Check if game helpers are working
  console.log('\n6. Testing game integration...');
  if (window.supabaseHelpers && window.supabaseHelpers.isSupabaseAvailable()) {
    console.log('✅ Game integration working!');
    
    // Force re-initialization
    console.log('\n7. Re-initializing game systems...');
    try {
      await window.supabaseHelpers.initSupabase();
      if (window.leaderboardDebug && window.leaderboardDebug.refreshLeaderboard) {
        await window.leaderboardDebug.refreshLeaderboard();
        console.log('✅ Leaderboard refreshed!');
      }
      console.log('🎮 Game should now be ONLINE! Try playing a game.');
    } catch (reinitError) {
      console.error('❌ Re-initialization failed:', reinitError);
    }
  } else {
    console.log('❌ Game integration not working');
    console.log('💡 Try refreshing the page');
  }
  
  console.log('\n=====================================');
  console.log('🔧 Diagnostic complete!');
};

// Quick fix function
window.fixConnection = async function() {
  console.log('🔧 Attempting to fix connection...');
  
  try {
    // Re-run initialization
    if (window.supabaseHelpers) {
      await window.supabaseHelpers.initSupabase();
      console.log('✅ Supabase re-initialized');
    }
    
    // Refresh leaderboard
    if (window.leaderboardDebug) {
      await window.leaderboardDebug.refreshLeaderboard();
      console.log('✅ Leaderboard refreshed');
    }
    
    console.log('🎮 Try playing a game now - it should work!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.log('💡 Run diagnoseConnection() for detailed analysis');
  }
};

// Quick test function to set Supabase credentials and test connection
window.quickTestSupabase = async function(url, key) {
  if (!url || !key) {
    console.log(`
🚀 Quick Supabase Test
Usage: quickTestSupabase('your-url', 'your-key')

Example:
quickTestSupabase(
  'https://your-project.supabase.co',
  'your_anon_key_here'
)
    `);
    return;
  }
  
  console.log('🔧 Setting manual Supabase credentials...');
  
  // Set the credentials
  window.setManualSupabaseCredentials(url, key);
  
  // Reload the environment
  await loadEnvironmentVariables();
  
  // Test Supabase connection
  console.log('🧪 Testing Supabase connection...');
  
  if (window.supabaseHelpers && window.supabaseHelpers.initSupabase) {
    const success = await window.supabaseHelpers.initSupabase();
    if (success) {
      console.log('✅ Supabase connected successfully!');
      
      // Test leaderboard fetch
      try {
        const leaderboard = await window.supabaseHelpers.getLeaderboard(5);
        if (leaderboard) {
          console.log(`📊 Leaderboard test: Found ${leaderboard.length} entries`);
          console.log('🎮 Your game should now work in online mode!');
        } else {
          console.log('⚠️ Leaderboard returned null - check your database setup');
        }
      } catch (error) {
        console.log('⚠️ Leaderboard test failed:', error.message);
        console.log('💡 You may need to create the leaderboard table - see SUPABASE_SETUP.md');
      }
    } else {
      console.log('❌ Supabase connection failed');
    }
  } else {
    console.log('❌ Supabase helpers not loaded');
  }
};

// Enhanced debug function that shows detailed connection info
window.detailedSupabaseTest = async function(url, key) {
  if (!url || !key) {
    console.log('❌ URL and key required');
    return;
  }
  
  console.log('🔍 Detailed Supabase Connection Test');
  console.log('====================================');
  
  try {
    // Test 1: Check if supabase library is loaded
    console.log('1. Checking Supabase library...');
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase library not loaded!');
      return;
    }
    console.log('✅ Supabase library loaded');
    
    // Test 2: Try to create client directly
    console.log('2. Creating Supabase client...');
    let client;
    try {
      client = supabase.createClient(url, key);
      console.log('✅ Client created successfully');
    } catch (clientError) {
      console.error('❌ Failed to create client:', clientError);
      return;
    }
    
    // Test 3: Test basic connection
    console.log('3. Testing basic connection...');
    try {
      const { data, error } = await client.from('leaderboard').select('count');
      if (error) {
        console.error('❌ Database query failed:', error);
        console.log('💡 Common causes:');
        console.log('   - Table "leaderboard" does not exist');
        console.log('   - Row Level Security is blocking access');
        console.log('   - Invalid credentials');
        console.log('   - Project is paused/inactive');
      } else {
        console.log('✅ Database connection successful!');
        console.log('📊 Query result:', data);
      }
    } catch (connectionError) {
      console.error('❌ Connection error:', connectionError);
      console.log('💡 This might be a network issue or invalid URL');
    }
    
    // Test 4: Check if table exists with a simpler query
    console.log('4. Checking if leaderboard table exists...');
    try {
      const { data, error } = await client.from('leaderboard').select('*').limit(1);
      if (error) {
        if (error.message.includes('relation "leaderboard" does not exist')) {
          console.error('❌ Table "leaderboard" does not exist!');
          console.log('💡 Create the table using the SQL in SUPABASE_SETUP.md');
        } else {
          console.error('❌ Table query error:', error);
        }
      } else {
        console.log('✅ Leaderboard table exists and is accessible');
        console.log('📊 Sample data:', data);
      }
    } catch (tableError) {
      console.error('❌ Table check failed:', tableError);
    }
    
  } catch (overallError) {
    console.error('❌ Overall test failed:', overallError);
  }
  
  console.log('====================================');
  console.log('🔧 Test complete. Check results above.');
};

// Function to show current environment status
window.showSupabaseStatus = function() {
  console.log(`
🔍 Current Supabase Status:

Environment Variables:
- SUPABASE_DATABASE_URL: ${window.process?.env?.SUPABASE_DATABASE_URL ? '✅ Set' : '❌ Missing'}
- SUPABASE_ANON_KEY: ${window.process?.env?.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}

Manual Credentials (localStorage):
- URL: ${localStorage.getItem('MANUAL_SUPABASE_URL') ? '✅ Set' : '❌ Not set'}
- Key: ${localStorage.getItem('MANUAL_SUPABASE_KEY') ? '✅ Set' : '❌ Not set'}

Supabase Client:
- Initialized: ${window.supabaseHelpers?.isSupabaseAvailable() ? '✅ Yes' : '❌ No'}

💡 To fix offline mode:
1. Get credentials from https://supabase.com/dashboard
2. Run: quickTestSupabase('your-url', 'your-key')
3. Or set environment variables in Netlify
  `);
};

// Function to clear everything and start fresh
window.resetSupabaseSetup = function() {
  window.clearManualSupabaseCredentials();
  console.log('🔄 Supabase setup reset. Reload the page to start fresh.');
};

// Show helpful commands on load
console.log(`
🎮 Flattenhund Console Helpers Loaded!

Available commands:
- showSupabaseStatus()     → Check current Supabase setup
- quickTestSupabase(url, key) → Test Supabase credentials  
- detailedSupabaseTest(url, key) → Detailed connection test with error info
- resetSupabaseSetup()     → Clear all manual settings
- diagnoseConnection()     → Comprehensive diagnostic of Supabase connection
- fixConnection()          → Attempt to fix connection issues

💡 Your game is currently in ${window.supabaseHelpers?.isSupabaseAvailable() ? 'ONLINE' : 'OFFLINE'} mode
`); 