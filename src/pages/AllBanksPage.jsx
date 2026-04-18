import { motion } from 'framer-motion';
import { ArrowLeft, Trash, PencilSimple } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import { formatRp } from '../utils/formatters.js';

export default function AllBanksPage({ onBack, showToast }) {
  const { t } = useLang();
  const { banks, getBankBalance, deleteBank, hideBalance } = useTransactions();

  const handleDelete = (bankId, bankName) => {
    if (confirm(t('deleteBankConfirm').replace('{name}', bankName))) {
      deleteBank(bankId);
      showToast?.('🗑️ ' + t('bankDeleted'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="subpage-header">
        <button className="back-btn" onClick={onBack} id="btn-back-from-banks">
          <ArrowLeft weight="bold" size={20} />
        </button>
        <h2>{t('allBanks')}</h2>
      </div>

      {banks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏦</div>
          <p>{t('noBanks')}</p>
        </div>
      ) : (
        <div className="bank-list">
          {banks.map((bank, i) => {
            const bal = getBankBalance(bank.id);
            return (
              <motion.div
                key={bank.id}
                className="bank-list-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="bank-list-left">
                  <div
                    className="bank-list-dot"
                    style={{ background: bank.color }}
                  />
                  <div className="bank-list-info">
                    <h4>{bank.name} {bank.lastFour ? `•••• ${bank.lastFour}` : ''}</h4>
                    <p>{t('initialBalance')}: {formatRp(bank.initialBalance || 0)}</p>
                  </div>
                </div>
                <div className="bank-list-right">
                  <div className="bank-list-balance">
                    {hideBalance ? 'Rp ••••••' : formatRp(bal)}
                  </div>
                  <button
                    className="bank-delete-btn"
                    onClick={() => handleDelete(bank.id, bank.name)}
                  >
                    <Trash weight="bold" size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
