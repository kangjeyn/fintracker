import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import { formatRp, formatDate, formatTime, getCategoryInfo } from '../utils/formatters.js';

function TransactionItem({ tx, onDelete }) {
  const { lang } = useLang();
  const catInfo = getCategoryInfo(tx.category);
  const isIncome = tx.type === 'income';
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    if (diff < 0) {
      setOffsetX(Math.max(diff, -80));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (offsetX < -50) {
      onDelete(tx.id);
    }
    setOffsetX(0);
  }, [offsetX, tx.id, onDelete]);

  return (
    <motion.div
      className="tx-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'relative', overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete background */}
      {offsetX < -10 && (
        <div className="tx-delete-bg">
          <Trash weight="bold" />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          transform: `translateX(${offsetX}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease',
        }}
      >
        <div className="tx-item-left">
          <div className="tx-icon">{catInfo.icon}</div>
          <div className="tx-info">
            <h4>{tx.note || tx.category}</h4>
            <p>{tx.category} • {formatTime(tx.date)}</p>
          </div>
        </div>
        <div className="tx-right">
          <div className={`tx-amount ${isIncome ? 'income' : 'expense'}`}>
            {isIncome ? '+' : '-'}{formatRp(tx.amount)}
          </div>
          <div className="tx-date">{formatDate(tx.date, lang)}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TransactionList({ transactions, maxItems }) {
  const { t } = useLang();
  const { deleteTransaction } = useTransactions();

  const handleDelete = (id) => {
    deleteTransaction(id);
  };

  const displayTx = maxItems ? transactions.slice(0, maxItems) : transactions;

  if (displayTx.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💸</div>
        <p>{t('noTransactions')}</p>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      <AnimatePresence>
        {displayTx.map(tx => (
          <TransactionItem
            key={tx.id}
            tx={tx}
            onDelete={handleDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
