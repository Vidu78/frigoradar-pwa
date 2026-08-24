-- Aggiunge la colonna image_url alla tabella inventory_items se non esiste già.
-- Questo risolve l'errore che impedisce il salvataggio dei prodotti scansionati (che hanno un'immagine da OpenFoodFacts).

ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS image_url TEXT;
