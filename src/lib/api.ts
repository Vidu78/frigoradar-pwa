import { supabase } from './supabase';
import i18n from '../i18n/config';

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
    title: i18n.t('credits.title'),
    message: `${dati.error ?? i18n.t('credits.exhausted')} ${i18n.t('credits.body')}`,
    type: 'info',
    confirmText: i18n.t('credits.discover_pro'),
    cancelText: i18n.t('credits.continue_free'),
  });

  if (vuolePro) window.location.assign('/pro');
  return true;
}

// Quando Google non ha capacita' la function risponde 503: non e' colpa
// dell'utente ne' un bug, passa da solo. Merita "riprova tra poco", non un
// errore del server con dentro i nomi dei modelli.
export async function aiOccupata(res: Response): Promise<boolean> {
  if (res.status !== 503) return false;

  const { useDialogStore } = await import('../store/dialogStore');
  await useDialogStore.getState().showDialog({
    title: i18n.t('common.ai_busy'),
    message: i18n.t('common.ai_busy_msg'),
    type: 'info',
    isAlert: true,
    confirmText: 'Ok',
  });
  return true;
}
