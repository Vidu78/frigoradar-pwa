-- Carte fedeltà brandizzate: id del catalogo (src/data/loyaltyBrands.ts) e formato del codice
-- letto dallo scanner, così il retro della carta lo ridisegna nel formato originale.
-- Finché queste colonne mancano il client salva la carta senza (fallback su PGRST204).
alter table public.loyalty_cards
  add column if not exists brand_id text,
  add column if not exists barcode_format text;

-- Le carte salvate prima del catalogo: assegna il marchio dal nome del negozio
update public.loyalty_cards set brand_id = lower(store_name)
where brand_id is null
  and lower(store_name) in ('esselunga','coop','conad','carrefour','lidl','md','eurospin','crai','famila','despar','bennet','iper','todis','ikea','decathlon','sephora','kiabi','douglas','tigros','unes','sigma','basko','coin','ovs','payback','q8','eni','ip','obi','euronics','unieuro','mediaworld','mondadori','rinascente','pittarosso','cisalfa','arcaplanet','maxizoo','bottegaverde','yvesrocher','tigota','acquaesapone','feltrinelli','ilgigante','leroymerlin','penny','pam','ali','deco','hm');
update public.loyalty_cards set brand_id = 'pam' where brand_id is null and lower(store_name) in ('pam panorama','panorama');
update public.loyalty_cards set brand_id = 'penny' where brand_id is null and lower(store_name) = 'penny market';
update public.loyalty_cards set brand_id = 'md' where brand_id is null and lower(store_name) = 'md discount';
update public.loyalty_cards set brand_id = 'feltrinelli' where brand_id is null and lower(store_name) in ('lafeltrinelli','la feltrinelli');
update public.loyalty_cards set brand_id = 'hm' where brand_id is null and lower(store_name) = 'h&m';
