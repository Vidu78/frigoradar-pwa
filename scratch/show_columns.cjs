const fs = require('fs');
const path = require('path');

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

async function showColumns() {
  console.log("Querying database schema via OpenAPI root...");
  
  const res = await fetch(`${supabaseUrl}/`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  if (!res.ok) {
    console.error("Failed to fetch OpenAPI spec:", res.status, res.statusText);
    return;
  }
  const spec = await res.json();
  const definitions = spec.definitions;
  const inventoryDef = definitions ? definitions.inventory_items : null;
  if (inventoryDef) {
    console.log("\nTable 'inventory_items' columns in schema cache:");
    console.log(Object.keys(inventoryDef.properties));
  } else {
    console.log("Table definitions not found in response.");
    if (definitions) {
      console.log("Tables found:", Object.keys(definitions));
    }
  }
}

showColumns();
