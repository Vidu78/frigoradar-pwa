import { Trash2, Mail } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

// ponytail: pagina pubblica richiesta da Google Play (Sicurezza dei dati).
// Deve restare leggibile anche a chi ha disinstallato l'app, quindi niente login.

const MAIL = <a href="mailto:privacy@frigoradar.it" style={{ color: '#00FFAA' }}>privacy@frigoradar.it</a>;

export default function EliminaAccountPage() {
  const { t } = useTranslation();
  const tx = { strong: <strong />, mail: MAIL };
  return (
    <div style={{
      minHeight: '100dvh', padding: '32px 16px 60px', display: 'flex', justifyContent: 'center',
      color: 'white', background: 'radial-gradient(circle at 50% 0%, rgba(0,255,170,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: '620px', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Trash2 size={30} color="#00FFAA" />
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t('delete_account.title')}</h1>
        </div>

        <h2 style={h2}>{t('delete_account.in_app')}</h2>
        <p style={p}><Trans i18nKey="delete_account.in_app_text" components={tx} /></p>

        <h2 style={h2}>{t('delete_account.no_app')}</h2>
        <p style={p}><Trans i18nKey="delete_account.no_app_text" components={tx} /></p>

        <h2 style={h2}>{t('delete_account.partial')}</h2>
        <p style={p}><Trans i18nKey="delete_account.partial_text" components={tx} /></p>

        <h2 style={h2}>{t('delete_account.deleted')}</h2>
        <ul style={p}>
          {(t('delete_account.deleted_list', { returnObjects: true }) as string[]).map((row, i) => <li key={i}>{row}</li>)}
        </ul>

        <h2 style={h2}>{t('delete_account.kept')}</h2>
        <p style={p}><Trans i18nKey="delete_account.kept_text" components={tx} /></p>

        <p style={{ ...p, marginTop: '32px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          {t('delete_account.doubts')} {MAIL} ·
          {' '}<a href="https://frigoradar.it/privacy" style={a}>{t('delete_account.privacy')}</a>
        </p>
      </div>
    </div>
  );
}

const h2: React.CSSProperties = { fontSize: '1.05rem', marginTop: '28px', marginBottom: '8px', color: '#00FFAA' };
const p: React.CSSProperties = { margin: 0, color: 'var(--text-muted)' };
const a: React.CSSProperties = { color: '#00FFAA' };
