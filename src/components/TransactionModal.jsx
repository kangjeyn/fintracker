import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import { CATEGORIES } from '../utils/formatters.js';

export default function TransactionModal({ onClose, showToast }) {
  const { t } = useLang();
  const { addTransaction, banks } = useTransactions();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankId, setBankId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !note) return;

    addTransaction({
      type,
      amount: parseInt(amount),
      category,
      note,
      date: new Date(date).toISOString(),
      bankId: bankId || null,
    });

    showToast?.('✅ ' + t('save'));
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
          <h2>{t('addTransaction')}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => setType('expense')}
            >
              {t('expenseLabel')}
            </button>
            <button
              type="button"
              className={`type-btn ${type === 'income' ? 'active income' : ''}`}
              onClick={() => setType('income')}
            >
              {t('incomeLabel')}
            </button>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label>{t('amount')}</label>
            <input
              type="number"
              className="form-input"
              placeholder={t('amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              id="input-amount"
            />
          </div>

          {/* Bank Selection */}
          {banks.length > 0 && (
            <div className="form-group">
              <label>{t('selectBankAccount')}</label>
              <select
                className="form-input"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                id="input-bank-select"
              >
                <option value="">{t('noBankSelected')}</option>
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} {bank.lastFour ? `•••• ${bank.lastFour}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div className="form-group">
            <label>{t('date')}</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              id="input-date"
            />
          </div>

          {/* Category Grid */}
          <div className="form-group">
            <label>{t('category')}</label>
            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  className={`cat-btn ${category === cat.value ? 'active' : ''}`}
                  onClick={() => setCategory(cat.value)}
                >
                  <span className="cat-emoji">{cat.icon}</span>
                  <span className="cat-label">{t(cat.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="form-group">
            <label>{t('note')}</label>
            <input
              type="text"
              className="form-input"
              placeholder={t('notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              id="input-note"
            />
          </div>

          <button type="submit" className="btn-primary" id="btn-save-transaction">
            {t('save')}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
