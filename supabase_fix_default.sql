-- Fix RLS: aggiunge DEFAULT automatico a family_id
-- Così anche i client vecchi (cached) possono inserire senza inviare family_id
ALTER TABLE inventory_items ALTER COLUMN family_id SET DEFAULT auth.uid();
ALTER TABLE shopping_items ALTER COLUMN family_id SET DEFAULT auth.uid();
