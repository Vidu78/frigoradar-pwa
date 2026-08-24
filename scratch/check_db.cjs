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

if (!supabaseAnonKey) {
  console.error("VITE_SUPABASE_ANON_KEY is missing in .env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log(`Checking connection to: ${supabaseUrl}`);
  
  // Test select from inventory_items
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error querying 'inventory_items':", error);
  } else {
    console.log("SUCCESS querying 'inventory_items'! Found rows:", data.length);
  }

  // Test select from products
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (prodError) {
    console.error("Error querying 'products':", prodError);
  } else {
    console.log("SUCCESS querying 'products'! Found rows:", prodData.length);
  }
}

check();
