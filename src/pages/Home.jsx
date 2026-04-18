import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import BalanceCard from '../components/BalanceCard.jsx';
import BankCarousel from '../components/BankCarousel.jsx';
import TransactionList from '../components/TransactionList.jsx';
import AddBankModal from '../components/AddBankModal.jsx';

export default function Home({ onNavigate, showToast }) {
  const { t } = useLang();
  const { transactions, banks } = useTransactions();
  const [showAddBank, setShowAddBank] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <BalanceCard />

      {/* Bank Cards Section */}
      <div className="section-header">
        <h3>{t('savedCards')}</h3>
        {banks.length > 0 && (
          <button onClick={() => onNavigate('allBanks')} id="btn-view-all-banks">
            {t('seeAll')}
          </button>
        )}
      </div>
      <BankCarousel
        onViewAll={() => onNavigate('allBanks')}
        onAddBank={() => setShowAddBank(true)}
      />

      {/* Recent History */}
      <div className="section-header">
        <h3>{t('recentHistory')}</h3>
        {transactions.length > 0 && (
          <button onClick={() => onNavigate('allTransactions')} id="btn-view-all-transactions">
            {t('seeAll')}
          </button>
        )}
      </div>
      <TransactionList transactions={transactions} maxItems={5} />

      {/* Add Bank Modal */}
      <AnimatePresence>
        {showAddBank && (
          <AddBankModal
            onClose={() => setShowAddBank(false)}
            showToast={showToast}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
