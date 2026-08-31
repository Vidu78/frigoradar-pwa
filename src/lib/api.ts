import { supabase } from './supabase';

// Gli endpoint /api/* ora richiedono la sessione Supabase.
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
  };
}

// Quando i crediti AI della settimana sono finiti la function risponde 402:
// non e' un errore da mostrare come tale, e' il momento del paywall.
export async function limiteRaggiunto(res: Response): Promise<boolean> {
  if (res.status !== 402) return false;

  const dati = await res.json().catch(() => ({} as any));
  const { useDialogStore } = await import('../store/dialogStore');

  const vuolePro = await useDialogStore.getState().showDialog({
    title: 'Crediti AI esauriti',
    message: `${dati.error ?? 'Hai finito i crediti AI di questa settimana.'} Puoi continuare ad aggiungere prodotti col barcode o a mano: quelli non hanno limiti. Con PRO scansioni e ricette sono illimitate.`,
    type: 'info',
    confirmText: 'Scopri PRO',
    cancelText: 'Continua gratis',
  });

  if (vuolePro) window.location.assign('/pro');
  return true;
}
