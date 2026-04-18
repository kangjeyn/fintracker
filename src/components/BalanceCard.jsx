import { ArrowDownLeft, ArrowUpRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import { formatRp } from '../utils/formatters.js';

export default function BalanceCard() {
  const { t } = useLang();
  const { balance, totalIncome, totalExpense, hideBalance, toggleHideBalance, banks, totalBankBalance } = useTransactions();

  // For existing users: if no banks → use raw transaction balance
  // If banks exist → totalBankBalance (bank initial balances + all transactions)
  const displayBalance = banks.length > 0 ? totalBankBalance : balance;

  return (
    <motion.div
      className="balance-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="balance-top-row">
        <p className="balance-label">{t('totalBalance')}</p>
        <button
          className="hide-balance-btn"
          onClick={toggleHideBalance}
          aria-label="Toggle balance visibility"
          id="btn-toggle-hide-balance"
        >
          {hideBalance ? <EyeSlash weight="bold" size={20} /> : <Eye weight="bold" size={20} />}
        </button>
      </div>
      <motion.h2
        className="balance-amount"
        key={hideBalance ? 'hidden' : displayBalance}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {hideBalance ? 'Rp ••••••••' : formatRp(displayBalance)}
      </motion.h2>
      <div className="balance-stats">
        <div className="stat-card">
          <div className="stat-icon income">
            <ArrowDownLeft weight="bold" />
          </div>
          <div>
            <span className="stat-label">{t('income')}</span>
            <div className="stat-value">
              {hideBalance ? '••••••' : formatRp(totalIncome)}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon expense">
            <ArrowUpRight weight="bold" />
          </div>
          <div>
            <span className="stat-label">{t('expense')}</span>
            <div className="stat-value">
              {hideBalance ? '••••••' : formatRp(totalExpense)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
