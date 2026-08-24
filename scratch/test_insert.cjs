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
  
  // Test insert with image_url
  const itemWithImage = {
    user_id: TEST_USER_ID,
    custom_name: 'Test Prodotto con Immagine',
    quantity: 1,
    location: 'FRIDGE',
    is_frozen: false,
    health_score: 'Sano',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
  };

  console.log("\nAttempt 1: Inserting WITH image_url...");
  const { data: d1, error: e1 } = await supabase
    .from('inventory_items')
    .insert([itemWithImage])
    .select();

  if (e1) {
    console.error("FAILED Attempt 1:", e1.message, e1.details, e1.hint);
  } else {
    console.log("SUCCESS Attempt 1! Inserted:", d1);
    // Delete it to keep DB clean
    await supabase.from('inventory_items').delete().eq('id', d1[0].id);
  }

  // Test insert WITHOUT image_url
  const itemWithoutImage = {
    user_id: TEST_USER_ID,
    custom_name: 'Test Prodotto senza Immagine',
    quantity: 1,
    location: 'FRIDGE',
    is_frozen: false,
    health_score: 'Sano'
  };

  console.log("\nAttempt 2: Inserting WITHOUT image_url...");
  const { data: d2, error: e2 } = await supabase
    .from('inventory_items')
    .insert([itemWithoutImage])
    .select();

  if (e2) {
    console.error("FAILED Attempt 2:", e2.message, e2.details, e2.hint);
  } else {
    console.log("SUCCESS Attempt 2! Inserted:", d2);
    // Delete it to keep DB clean
    await supabase.from('inventory_items').delete().eq('id', d2[0].id);
  }
}

testInsert();
