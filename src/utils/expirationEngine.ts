import i18n from '../i18n/config';

export type ExpirationStatus = 'EXPIRED' | 'URGENT' | 'SOON' | 'NORMAL' | 'NO_DATE';

export function getExpirationStatus(expirationDate: string | null): { status: ExpirationStatus, days: number, color: string, text: string } {
  if (!expirationDate) {
    return { status: 'NO_DATE', days: 0, color: 'var(--text-muted)', text: i18n.t('expiry.none') };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'EXPIRED', days: diffDays, color: '#FF3B30', text: i18n.t('expiry.expired') }; // Rosso Acceso / Lampeggiante (gestito via CSS)
  }
  
  if (diffDays === 0 || diffDays === 1) {
    return { status: 'URGENT', days: diffDays, color: '#FF453A', text: diffDays === 0 ? i18n.t('expiry.today') : i18n.t('expiry.tomorrow') }; // Rosso
  }
  
  if (diffDays <= 3) {
    return { status: 'SOON', days: diffDays, color: '#FF9F0A', text: i18n.t('expiry.in_days', { count: diffDays }) }; // Arancione
  }

  return { status: 'NORMAL', days: diffDays, color: '#32D74B', text: i18n.t('expiry.in_days', { count: diffDays }) }; // Verde
}
