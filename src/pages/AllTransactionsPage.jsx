import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Funnel } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import TransactionList from '../components/TransactionList.jsx';

export default function AllTransactionsPage({ onBack }) {
  const { t } = useLang();
  const { transactions } = useTransactions();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(tx => tx.type === filter);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="subpage-header">
        <button className="back-btn" onClick={onBack} id="btn-back-from-transactions">
          <ArrowLeft weight="bold" size={20} />
        </button>
        <h2>{t('allTransactions')}</h2>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '16px' }}>
        {[
          { key: 'all', label: t('filterAll') },
          { key: 'income', label: t('incomeLabel') },
          { key: 'expense', label: t('expenseLabel') },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction count */}
      <div style={{ 
        fontSize: '13px', 
        color: 'var(--text-secondary)', 
        marginBottom: '12px',
        paddingLeft: '2px'
      }}>
        {filtered.length} {t('transactionsCount')}
      </div>

      <TransactionList transactions={filtered} />
    </motion.div>
  );
}
