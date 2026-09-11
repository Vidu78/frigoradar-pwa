import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StorageLink } from '../components/StorageImage';
import { useLoyaltyStore, type LoyaltyCard } from '../store/loyaltyStore';
import { X, Plus, Trash2, CreditCard, Camera, Tag, Search, Wallet } from 'lucide-react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import BarcodeScanner from '../components/BarcodeScanner';
import BrandLogo from '../components/BrandLogo';
import { useToastStore } from '../store/toastStore';
import { useDialogStore } from '../store/dialogStore';
import { OTHER_BRAND, findBrand, searchBrands, type LoyaltyBrand } from '../data/loyaltyBrands';
import { formatFromDetector, guessFormat, resolveFormat, type CardCodeFormat } from '../utils/barcode';

// Il codice sul retro, nel formato originale della carta cosi' la cassa lo legge al primo colpo
function CardCode({ value, format }: { value: string; format: CardCodeFormat }) {
  if (format === 'QR') {
    return <QRCodeSVG value={value} size={120} bgColor="transparent" fgColor="#000" />;
  }
  return (
    <Barcode
      value={value}
      format={format}
      background="transparent"
      lineColor="#000"
      width={format === 'CODE128' && value.length > 14 ? 1.4 : 2}
      height={64}
      displayValue={true}
      fontSize={14}
      margin={0}
    />
  );
}

export default function LoyaltyWallet() {
  const { t } = useTranslation();
  const { cards, discounts, fetchCards, fetchDiscounts, addCard, deleteCard, addPaperDiscount, loading } = useLoyaltyStore();
  const { showToast } = useToastStore();
  const { showDialog } = useDialogStore();
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [scannedFormat, setScannedFormat] = useState<CardCodeFormat | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<LoyaltyBrand | null>(null);
  const [brandQuery, setBrandQuery] = useState('');
  const [customStoreName, setCustomStoreName] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Per i coupon cartacei
  const [uploadingDiscount, setUploadingDiscount] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
    fetchDiscounts();
  }, [fetchCards, fetchDiscounts]);

  const brandResults = useMemo(() => searchBrands(brandQuery), [brandQuery]);

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>, cardId: string, storeName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDiscount(cardId);
    showToast(t('loyalty.saving_coupon'), 'info');
    try {
      await addPaperDiscount(file, t('loyalty.paper_coupon'), '', cardId, storeName);
      showToast(t('loyalty.coupon_saved'), 'success');
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setUploadingDiscount(null);
      e.target.value = '';
    }
  };

  const handleScan = (value: string, format?: string) => {
    setScannedBarcode(value);
    setScannedFormat(formatFromDetector(format));
    setIsScanning(false);
  };

  const resetAddFlow = () => {
    setScannedBarcode(null);
    setScannedFormat(null);
    setIsAddingManual(false);
    setSelectedBrand(null);
    setBrandQuery('');
    setCustomStoreName('');
  };

  const isOther = selectedBrand?.id === OTHER_BRAND.id;
  const canSave = !!scannedBarcode && !!selectedBrand && (!isOther || customStoreName.trim().length > 0);

  const handleSaveCard = async () => {
    if (!scannedBarcode || !selectedBrand) return;
    const finalName = isOther ? customStoreName.trim() : selectedBrand.name;
    try {
      await addCard({
        store_name: finalName,
        barcode_value: scannedBarcode.trim(),
        color: selectedBrand.color,
        brand_id: isOther ? null : selectedBrand.id,
        barcode_format: scannedFormat || guessFormat(scannedBarcode)
      });
      resetAddFlow();
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  if (isScanning) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}>
            <button aria-label={t('common.close')} onClick={() => setIsScanning(false)} className="icon-button" style={{ background: 'rgba(0,0,0,0.5)' }}>
              <X size={24} />
            </button>
          </div>
          <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
          <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            <p>{t('loyalty.scan_sub')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAddingManual || scannedBarcode) {
    const previewFormat = scannedBarcode ? (scannedFormat || guessFormat(scannedBarcode)) : null;
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg, #0a0a0f 0%, #0f1520 100%)',
        zIndex: 200, display: 'flex', flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* HEADER */}
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button aria-label={t('common.close')}
            onClick={resetAddFlow}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{t('loyalty.new_card')}</h2>
          <div style={{ width: 44 }} />
        </div>

        {/* STEP 1 — SCANSIONA O DIGITA CODICE */}
        <div style={{ padding: '24px 20px 0' }}>
          <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            ① {t('loyalty.step_code')}
          </p>

          <button
            onClick={() => setIsScanning(true)}
            style={{
              width: '100%', padding: '20px',
              background: 'linear-gradient(135deg, rgba(0,255,170,0.15) 0%, rgba(0,200,130,0.08) 100%)',
              border: '1.5px dashed rgba(0,255,170,0.5)',
              borderRadius: '20px', color: '#00FFAA',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              cursor: 'pointer', marginBottom: '16px',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(0,255,170,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={26} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t('loyalty.scan_btn')}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '2px' }}>{t('loyalty.scan_sub')}</div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', fontWeight: 600 }}>{t('loyalty.or_manual')}</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${scannedBarcode ? 'rgba(0,255,170,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '18px', padding: '6px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
            transition: 'border-color 0.2s', marginBottom: '12px'
          }}>
            <CreditCard size={20} color={scannedBarcode ? '#00FFAA' : 'rgba(255,255,255,0.3)'} />
            <input
              type="text"
              placeholder={t('loyalty.code_placeholder')}
              value={scannedBarcode || ''}
              onChange={e => { setScannedBarcode(e.target.value); setScannedFormat(null); }}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: 'white', fontSize: '1rem', padding: '14px 0',
                letterSpacing: '1.5px', fontFamily: 'monospace', fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {scannedBarcode && previewFormat && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
              <CardCode value={scannedBarcode} format={previewFormat} />
              <span style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '1px' }}>{previewFormat}</span>
            </div>
          )}
        </div>

        {/* STEP 2 — SCEGLI IL NEGOZIO */}
        <div style={{ padding: '28px 20px 0' }}>
          <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            ② {t('loyalty.step_store')}
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: '16px', padding: '2px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px'
          }}>
            <Search size={18} color="rgba(255,255,255,0.35)" />
            <input
              type="search"
              placeholder={t('loyalty.search_store')}
              value={brandQuery}
              onChange={e => setBrandQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.95rem', padding: '12px 0', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[...brandResults, OTHER_BRAND].map(b => {
              const isSelected = selectedBrand?.id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  aria-pressed={isSelected}
                  style={{
                    padding: '12px 8px 10px',
                    borderRadius: '16px',
                    border: isSelected ? `2px solid ${b.color}` : '1.5px solid rgba(255,255,255,0.08)',
                    background: isSelected ? `linear-gradient(135deg, ${b.color}, ${b.color}b0)` : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    boxShadow: isSelected ? `0 8px 20px ${b.color}40` : 'none',
                    minWidth: 0
                  }}
                >
                  {b.id === OTHER_BRAND.id ? (
                    <div style={{ width: 40, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={20} color="white" />
                    </div>
                  ) : (
                    <BrandLogo brand={b} name={b.name} size="sm" />
                  )}
                  <span style={{
                    color: isSelected ? (b.id === OTHER_BRAND.id ? 'white' : b.text) : 'rgba(255,255,255,0.7)',
                    fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
                  }}>
                    {b.id === OTHER_BRAND.id ? t('loyalty.other') : b.name}
                  </span>
                </button>
              );
            })}
          </div>

          {isOther && (
            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '18px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CreditCard size={18} color="rgba(255,255,255,0.3)" />
              <input
                type="text"
                placeholder={t('loyalty.custom_name')}
                value={customStoreName}
                onChange={e => setCustomStoreName(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1rem', padding: '14px 0', outline: 'none' }}
              />
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        <div style={{ padding: '32px 20px 48px' }}>
          <button
            onClick={handleSaveCard}
            disabled={loading || !canSave}
            style={{
              width: '100%', padding: '18px',
              background: (!loading && canSave)
                ? 'linear-gradient(135deg, #00FFAA 0%, #00CC88 100%)'
                : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '20px',
              color: (!loading && canSave) ? '#000' : 'rgba(255,255,255,0.3)',
              fontWeight: 800, fontSize: '1.05rem',
              cursor: (!loading && canSave) ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s',
              boxShadow: (!loading && canSave) ? '0 10px 30px rgba(0,255,170,0.35)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            {loading ? t('loyalty.saving') : (
              <><Plus size={22} /> {t('loyalty.save_card')}</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: '100px' }}>
        <div style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet color="var(--primary)" size={28} />
            {t('loyalty.title')}
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <CreditCard size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{t('loyalty.no_cards')}</p>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('loyalty.no_cards_sub')}</p>
            </div>
          ) : (
            cards.map((card: LoyaltyCard) => {
              const isExpanded = expandedCardId === card.id;
              const brand = findBrand(card.brand_id, card.store_name);
              const bg = brand?.color || card.color || OTHER_BRAND.color;
              const textColor = brand?.text || (card.color === '#FFD700' ? '#111' : '#fff');
              const cardDiscounts = discounts.filter(d => d.loyalty_card_id === card.id);
              const format = resolveFormat(card.barcode_format, card.barcode_value);

              return (
                <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
                  {/* 3D Flip Card */}
                  <div
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                    style={{
                      perspective: '1000px',
                      width: '100%',
                      height: '210px',
                      cursor: 'pointer',
                      zIndex: isExpanded ? 10 : 1
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)',
                      transformStyle: 'preserve-3d',
                      transform: isExpanded ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}>
                      {/* FRONT OF CARD */}
                      <div style={{
                        position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                        background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)`,
                        borderRadius: '20px', padding: '22px 24px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: textColor, overflow: 'hidden'
                      }}>
                        {/* Riflesso in alto a destra, come una carta di plastica */}
                        <div aria-hidden="true" style={{ position: 'absolute', right: -60, top: -80, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                          <BrandLogo brand={brand} name={card.store_name} />
                          {card.points_balance > 0 && (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('loyalty.points')}</div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1 }}>{card.points_balance}</div>
                            </div>
                          )}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <div style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{card.store_name}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '4px' }}>
                            {brand?.program || t('loyalty.generic_program')}
                          </div>
                        </div>
                      </div>

                      {/* BACK OF CARD */}
                      <div style={{
                        position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                        background: '#ffffff', color: '#000000',
                        borderRadius: '20px', padding: '20px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        transform: 'rotateY(180deg)',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.8)',
                        borderTop: `10px solid ${bg}`
                      }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#333', position: 'absolute', top: 16, left: 20 }}>{card.store_name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#999', position: 'absolute', top: 20, right: 20, letterSpacing: '1px' }}>{format}</div>

                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '14px', overflow: 'hidden' }}>
                          <CardCode value={card.barcode_value} format={format} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DISCOUNTS SECTION (Visible only when card is expanded) */}
                  {isExpanded && (
                    <div style={{
                      background: 'var(--bg-panel)',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      animation: 'fadeIn 0.4s ease-out'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                          <Tag size={18} color="var(--primary)" /> {t('loyalty.coupons')} ({cardDiscounts.length})
                        </h4>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', background: 'var(--primary)', color: '#000', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,255,170,0.3)' }}>
                          <Camera size={16} /> {t('loyalty.photo')}
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handlePhotoScan(e, card.id, card.store_name)}
                            style={{ display: 'none' }}
                            disabled={uploadingDiscount === card.id}
                          />
                        </label>
                      </div>

                      {cardDiscounts.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                          <Tag size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('loyalty.no_coupons')}</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {cardDiscounts.map(disc => (
                            <div key={disc.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', borderLeft: `4px solid ${bg}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <strong style={{ color: 'white', fontSize: '1.1rem' }}>{disc.discount_amount || disc.description}</strong>
                                {disc.expiration_date && (
                                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,69,58,0.2)', color: '#FF453A', padding: '4px 8px', borderRadius: '8px', fontWeight: 600 }}>{t('loyalty.expires')}: {disc.expiration_date}</span>
                                )}
                              </div>
                              {disc.discount_amount && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '6px' }}>{disc.description}</div>}
                              {disc.image_url && (
                                <StorageLink value={disc.image_url} bucket="receipts" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                                  <Camera size={14} /> {t('loyalty.see_photo')}
                                </StorageLink>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const confirmed = await showDialog({
                              title: t('loyalty.delete_card'),
                              message: t('loyalty.delete_confirm', { name: card.store_name }),
                              type: 'danger'
                            });
                            if (confirmed) {
                              deleteCard(card.id);
                            }
                          }}
                          style={{
                            background: 'rgba(255,69,58,0.1)',
                            border: '1px solid rgba(255,69,58,0.3)',
                            color: '#FF453A',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Trash2 size={16} /> {t('loyalty.delete_card')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          className="primary-button"
          onClick={() => setIsAddingManual(true)}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}
        >
          <Plus /> {t('loyalty.add')}
        </button>
    </div>
  );
}

export function LoyaltyWalletModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ background: 'var(--bg-color)', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0 0' }}>
          <button aria-label={t('common.close')} onClick={onClose} className="icon-button"><X size={24} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <LoyaltyWallet />
        </div>
      </div>
    </div>
  );
}
