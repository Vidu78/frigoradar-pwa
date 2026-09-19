-- Il codice a barre non era mai stato salvato sull'inventario: la modale
-- "collega al prodotto esistente" scriveva su una colonna inesistente (42703)
-- e, non trovando barcode su nessun articolo, si apriva a ogni scansione.
alter table public.inventory_items
  add column if not exists barcode text;

create index if not exists inventory_items_barcode_idx
  on public.inventory_items (family_id, barcode)
  where barcode is not null;
