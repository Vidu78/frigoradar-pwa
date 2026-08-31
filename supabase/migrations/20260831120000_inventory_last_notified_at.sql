-- =============================================================================
-- inventory_items.last_notified_at
-- =============================================================================
--
-- La edge function check_expirations, dopo 0cdf286, filtra e aggiorna
-- inventory_items.last_notified_at:
--
--     .or(`last_notified_at.is.null,last_notified_at.lt.${soglia}`)
--     .update({ last_notified_at: ... }).in('id', notificati)
--
-- Quella colonna non è creata da nessuna migration né da alcun altro .sql del
-- repository. PostgREST rifiuta la query con un errore di colonna sconosciuta,
-- `itemsError` viene sollevato e la function esce prima di inviare qualsiasi
-- notifica: la deduplica appena introdotta impedisce l'invio invece di
-- regolarlo.
--
-- È lo stesso schema del bug su consumption_logs: codice che scrive una colonna
-- mai creata, con l'errore che non arriva a nessuno.
--
-- Idempotente.
-- =============================================================================

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE;

-- La function gira con la service_role e bypassa la RLS, ma l'indice serve al
-- filtro che seleziona gli item ancora da notificare.
CREATE INDEX IF NOT EXISTS inventory_items_last_notified_at_idx
  ON public.inventory_items (last_notified_at);

NOTIFY pgrst, 'reload schema';
