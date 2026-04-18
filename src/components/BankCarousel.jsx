import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeSlash, Plus } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import { formatRp } from '../utils/formatters.js';

export default function BankCarousel({ onViewAll, onAddBank }) {
  const { t } = useLang();
  const { banks, getBankBalance, hideBalance } = useTransactions();

  if (banks.length === 0) {
    return (
      <div className="bank-carousel-empty">
        <button className="bank-add-card" onClick={onAddBank} id="btn-add-first-bank">
          <Plus weight="bold" size={28} />
          <span>{t('addBank')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bank-carousel-wrapper">
      <div className="bank-carousel">
        {banks.map((bank, i) => {
          const bal = getBankBalance(bank.id);
          return (
            <motion.div
              key={bank.id}
              className="bank-card"
              style={{
                background: `linear-gradient(135deg, ${bank.color}, ${bank.color}cc)`,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <div className="bank-card-header">
                <span className="bank-name">{bank.name} {bank.lastFour ? `•••• ${bank.lastFour}` : ''}</span>
              </div>
              <div className="bank-card-balance">
                {hideBalance ? 'Rp ••••••' : formatRp(bal)}
              </div>
              <div className="bank-card-label">{t('availableBalance')}</div>
            </motion.div>
          );
        })}

        {/* Add bank card at the end */}
        <button className="bank-add-card-mini" onClick={onAddBank} id="btn-add-bank-carousel">
          <Plus weight="bold" size={22} />
        </button>
      </div>
    </div>
  );
}
