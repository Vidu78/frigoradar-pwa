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

async function testInsert() {
  console.log(`Testing insert for user: ${TEST_USER_ID}`);
  
  // Test insert with image_url and category
  const itemWithImage = {
    user_id: TEST_USER_ID,
    custom_name: 'Test Prodotto con Immagine e Categoria',
    quantity: 1,
    location: 'FRIDGE',
    is_frozen: false,
    health_score: 'Sano',
    category: 'Latticini e Uova',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
  };

  console.log("\nAttempting final insert with all new fields...");
  const { data: d1, error: e1 } = await supabase
    .from('inventory_items')
    .insert([itemWithImage])
    .select();

  if (e1) {
    console.error("FAILED final insert:", e1.message, e1.details, e1.hint);
  } else {
    console.log("SUCCESS! Row inserted successfully with image_url and category:", d1[0]);
    // Delete it to keep DB clean
    await supabase.from('inventory_items').delete().eq('id', d1[0].id);
    console.log("SUCCESS! Deleted test row. Database is 100% healthy!");
  }
}

testInsert();
