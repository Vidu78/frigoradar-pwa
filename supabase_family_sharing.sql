-- Sincronizzazione Frigo di Famiglia
-- Aggiunta la colonna family_id a tutte le tabelle utente.

-- Aggiungi family_id a inventory_items
ALTER TABLE inventory_items ADD COLUMN family_id UUID;
UPDATE inventory_items SET family_id = user_id WHERE family_id IS NULL;
ALTER TABLE inventory_items ALTER COLUMN family_id SET NOT NULL;

-- Aggiorna policy per inventory_items
DROP POLICY IF EXISTS "Users view own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users insert own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users update own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users delete own inventory" ON inventory_items;

CREATE POLICY "Users view family inventory" ON inventory_items FOR SELECT USING (family_id = (SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid())));
CREATE POLICY "Users insert family inventory" ON inventory_items FOR INSERT WITH CHECK (family_id = (SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid())));
CREATE POLICY "Users update family inventory" ON inventory_items FOR UPDATE USING (family_id = (SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid())));
CREATE POLICY "Users delete family inventory" ON inventory_items FOR DELETE USING (family_id = (SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid())));

-- Ripeti per shopping_items
ALTER TABLE shopping_items ADD COLUMN family_id UUID;
UPDATE shopping_items SET family_id = user_id WHERE family_id IS NULL;
ALTER TABLE shopping_items ALTER COLUMN family_id SET NOT NULL;

DROP POLICY IF EXISTS "Users view own shopping list" ON shopping_items;
DROP POLICY IF EXISTS "Users insert own shopping list" ON shopping_items;
DROP POLICY IF EXISTS "Users update own shopping list" ON shopping_items;
DROP POLICY IF EXISTS "Users delete own shopping list" ON shopping_items;

CREATE POLICY "Users view family shopping list" ON shopping_items FOR SELECT USING (family_id = (SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid())));
CREATE POLICY "Users insert family shopping list" ON shopping_items FOR INSERT WITH CHECK (family_id = (SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid())));
CREATE POLICY "Users update family shopping list" ON shopping_items FOR UPDATE USING (family_id = (SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid())));
CREATE POLICY "Users delete family shopping list" ON shopping_items FOR DELETE USING (family_id = (SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'family_id')::uuid, auth.uid())));

-- Creazione tabella per inviti
CREATE TABLE family_invites (
  code TEXT PRIMARY KEY,
  family_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create invites" ON family_invites FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can read all invites" ON family_invites FOR SELECT USING (auth.role() = 'authenticated');
