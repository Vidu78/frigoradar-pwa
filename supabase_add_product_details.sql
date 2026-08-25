-- Aggiunge campi per la scheda prodotto dettagliata
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS nutritional_info JSONB;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS nutriscore TEXT;
