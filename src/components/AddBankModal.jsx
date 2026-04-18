import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions, BANK_PRESETS } from '../context/TransactionContext.jsx';

export default function AddBankModal({ onClose, showToast }) {
  const { t } = useLang();
  const { addBank } = useTransactions();
  const [selected, setSelected] = useState(null);
  const [lastFour, setLastFour] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('#64748b');

  const isCustom = selected && selected.name === 'Lainnya';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected) return;

    addBank({
      name: isCustom ? (customName || 'Bank Lainnya') : selected.name,
      lastFour: lastFour.slice(-4),
      color: isCustom ? customColor : selected.color,
      initialBalance: parseInt(initialBalance) || 0,
    });

    showToast?.('🏦 ' + t('bankAdded'));
    onClose();
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        <div className="modal-header">
          <h2>{t('addBank')}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Bank Presets */}
          <div className="form-group">
            <label>{t('selectBank')}</label>
            <div className="bank-preset-grid">
              {BANK_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  className={`bank-preset-btn ${selected?.name === preset.name ? 'active' : ''}`}
                  onClick={() => setSelected(preset)}
                  style={{
                    '--bank-color': preset.color,
                  }}
                >
                  <div
                    className="bank-preset-dot"
                    style={{ background: preset.color }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom name if "Lainnya" */}
          {isCustom && (
            <div className="form-group">
              <label>{t('bankNameCustom')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('bankNamePlaceholder')}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                id="input-custom-bank-name"
              />
            </div>
          )}

          {/* Last 4 digits */}
          <div className="form-group">
            <label>{t('lastFourDigits')}</label>
            <input
              type="text"
              className="form-input"
              placeholder="1234"
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              id="input-bank-last-four"
            />
          </div>

          {/* Initial Balance */}
          <div className="form-group">
            <label>{t('initialBalance')}</label>
            <input
              type="number"
              className="form-input"
              placeholder="1000000"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              id="input-bank-initial-balance"
            />
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              {t('initialBalanceHint')}
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!selected}
            style={{ opacity: selected ? 1 : 0.5 }}
            id="btn-save-bank"
          >
            {t('save')}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
