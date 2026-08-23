-- Tabella per i prodotti nel frigorifero
CREATE TABLE fridge_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT,
  expiry_date DATE,
  quantity INTEGER DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurazione Row Level Security (RLS) per permettere agli utenti di vedere solo la propria roba
ALTER TABLE fridge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fridge items"
  ON fridge_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fridge items"
  ON fridge_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fridge items"
  ON fridge_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fridge items"
  ON fridge_items FOR DELETE
  USING (auth.uid() = user_id);
