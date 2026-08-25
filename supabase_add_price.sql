-- Aggiunge il campo prezzo per i prodotti (utile per le statistiche)
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS price NUMERIC;
