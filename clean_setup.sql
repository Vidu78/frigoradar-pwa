-- ==========================================
-- SCRIPT DI RESET E SCHEMA COMPLETO (V3)
-- Per FrigoRadar - Esegui questo in Supabase SQL Editor
-- ==========================================

-- 1. Pulisce tutto il vecchio database per evitare conflitti di tipi ed enum
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shopping_items CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS consumption_logs CASCADE;
DROP TABLE IF EXISTS fridge_items CASCADE;

DROP TYPE IF EXISTS location_type CASCADE;
DROP TYPE IF EXISTS expiration_status CASCADE;

-- 2. Crea le estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. ENUMS
CREATE TYPE location_type AS ENUM ('FRIDGE', 'FREEZER', 'PANTRY', 'OTHER');
CREATE TYPE expiration_status AS ENUM ('EXPIRED', 'URGENT', 'SOON', 'NORMAL', 'NO_DATE');

-- 4. PRODUCTS (Catalogo dei prodotti)
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  normalized_name TEXT,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  format TEXT,
  default_quantity NUMERIC,
  unit TEXT,
  image_url TEXT,
  storage_type location_type DEFAULT 'FRIDGE',
  default_shelf_life_days INTEGER,
  source TEXT DEFAULT 'USER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. INVENTORY ITEMS (L'inventario degli utenti)
CREATE TABLE inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  custom_name TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  location location_type DEFAULT 'FRIDGE',
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  opened_date DATE,
  is_opened BOOLEAN DEFAULT false,
  is_frozen BOOLEAN DEFAULT false,
  health_score TEXT,
  category TEXT DEFAULT 'Altro',
  image_url TEXT, -- Inserito direttamente qui
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SHOPPING LIST
CREATE TABLE shopping_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. RECIPES
CREATE TABLE recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB,
  instructions JSONB,
  preparation_time INTEGER,
  difficulty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CONSUMPTION LOGS
CREATE TABLE consumption_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity_consumed NUMERIC NOT NULL,
  health_score TEXT,
  consumed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. CONFIGURAZIONE ROW LEVEL SECURITY (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;

-- Criteri di accesso RLS
CREATE POLICY "Public products are viewable by everyone." ON products FOR SELECT USING (true);
CREATE POLICY "Users can insert products." ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update products." ON products FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users view own inventory" ON inventory_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own inventory" ON inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own inventory" ON inventory_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own shopping list" ON shopping_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own shopping list" ON shopping_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own shopping list" ON shopping_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own shopping list" ON shopping_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own logs" ON consumption_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logs" ON consumption_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. FORZA IL RILASCIO E RICARICAMENTO DELLA CACHE API
NOTIFY pgrst, 'reload schema';
