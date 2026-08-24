const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://ngcjpcdemuyxvgjqauzu.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_USER_ID = 'c5fbc463-e296-4b3b-9b23-4ba2869cee00'; // User ID di vincedurante@gmail.com

async function testColumns() {
  console.log("Testing columns of 'inventory_items'...");

  // Let's try inserting with different keys to see which ones fail
  const keysToTest = ['name', 'custom_name', 'expiry_date', 'expiration_date', 'quantity', 'location'];
  
  for (const key of keysToTest) {
    console.log(`\nTesting column: '${key}'`);
    const payload = {
      user_id: TEST_USER_ID,
      [key]: key === 'quantity' ? 1 : (key === 'location' ? 'FRIDGE' : 'TestValue')
    };
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([payload])
      .select();

    if (error) {
      console.log(`  Result for '${key}': FAILED - ${error.message}`);
    } else {
      console.log(`  Result for '${key}': SUCCESS!`);
      // Delete the inserted row
      await supabase.from('inventory_items').delete().eq('id', data[0].id);
    }
  }
}

testColumns();
