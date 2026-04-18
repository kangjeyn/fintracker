import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const TransactionContext = createContext();

// Default bank presets with Indonesian bank colors
const BANK_PRESETS = [
  { name: 'BCA', color: '#003d79', lastFour: '' },
  { name: 'Mandiri', color: '#003868', lastFour: '' },
  { name: 'BNI', color: '#f15a22', lastFour: '' },
  { name: 'BRI', color: '#00529c', lastFour: '' },
  { name: 'BSI', color: '#00a74a', lastFour: '' },
  { name: 'CIMB Niaga', color: '#7b0c15', lastFour: '' },
  { name: 'Danamon', color: '#fdbb30', lastFour: '' },
  { name: 'Permata', color: '#005baa', lastFour: '' },
  { name: 'BTPN/Jenius', color: '#00adee', lastFour: '' },
  { name: 'Bank Jago', color: '#ff6600', lastFour: '' },
  { name: 'GoPay', color: '#00aed6', lastFour: '' },
  { name: 'OVO', color: '#4c3494', lastFour: '' },
  { name: 'Dana', color: '#108ee9', lastFour: '' },
  { name: 'ShopeePay', color: '#ee4d2d', lastFour: '' },
  { name: 'Lainnya', color: '#64748b', lastFour: '' },
];

export { BANK_PRESETS };

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('finTracker_tx')) || [];
    } catch { return []; }
  });

  const [budgets, setBudgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('finTracker_budgets')) || {};
    } catch { return {}; }
  });

  const [banks, setBanks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('finTracker_banks')) || [];
    } catch { return []; }
  });

  const [hideBalance, setHideBalance] = useState(false);

  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('finTracker_geminiKey') || '');
  const [webhook, setWebhook] = useState(() => localStorage.getItem('finTracker_webhook') || '');

  useEffect(() => {
    localStorage.setItem('finTracker_tx', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finTracker_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finTracker_banks', JSON.stringify(banks));
  }, [banks]);

  // === Transaction CRUD ===
  const addTransaction = useCallback((tx) => {
    const newTx = { ...tx, id: Date.now(), date: tx.date || new Date().toISOString() };
    setTransactions(prev => [newTx, ...prev]);

    // Optional webhook sync
    const savedWebhook = localStorage.getItem('finTracker_webhook');
    if (savedWebhook) {
      fetch(savedWebhook, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      }).catch(console.error);
    }

    return newTx;
  }, []);

  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setTransactions([]);
  }, []);

  // === Bank CRUD ===
  const addBank = useCallback((bank) => {
    const newBank = {
      id: Date.now().toString(),
      name: bank.name,
      lastFour: bank.lastFour || '',
      color: bank.color || '#64748b',
      initialBalance: bank.initialBalance || 0,
      createdAt: new Date().toISOString(),
    };
    setBanks(prev => [...prev, newBank]);
    return newBank;
  }, []);

  const deleteBank = useCallback((bankId) => {
    setBanks(prev => prev.filter(b => b.id !== bankId));
    // Remove bank assignment from transactions
    setTransactions(prev => prev.map(tx =>
      tx.bankId === bankId ? { ...tx, bankId: null } : tx
    ));
  }, []);

  const updateBank = useCallback((bankId, updates) => {
    setBanks(prev => prev.map(b =>
      b.id === bankId ? { ...b, ...updates } : b
    ));
  }, []);

  // === Budget ===
  const setBudget = useCallback((category, amount) => {
    setBudgets(prev => ({ ...prev, [category]: amount }));
  }, []);

  const saveGeminiKey = useCallback((key) => {
    setGeminiKey(key);
    localStorage.setItem('finTracker_geminiKey', key);
  }, []);

  const saveWebhook = useCallback((url) => {
    setWebhook(url);
    localStorage.setItem('finTracker_webhook', url);
  }, []);

  const toggleHideBalance = useCallback(() => {
    setHideBalance(prev => !prev);
  }, []);

  // === Computed values ===
  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpense;

  // Get balance for a specific bank
  const getBankBalance = useCallback((bankId) => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return 0;

    const bankIncome = transactions
      .filter(tx => tx.bankId === bankId && tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const bankExpense = transactions
      .filter(tx => tx.bankId === bankId && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return (bank.initialBalance || 0) + bankIncome - bankExpense;
  }, [transactions, banks]);

  // Total balance across all banks (initial balances + tx flow)
  const totalBankBalance = useMemo(() => {
    const banksTotal = banks.reduce((sum, bank) => {
      return sum + getBankBalance(bank.id);
    }, 0);

    // Include unassigned transaction balance
    const unassignedIncome = transactions
      .filter(tx => !tx.bankId && tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const unassignedExpense = transactions
      .filter(tx => !tx.bankId && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return banksTotal + unassignedIncome - unassignedExpense;
  }, [transactions, banks, getBankBalance]);

  // Filter by period
  const getFilteredTransactions = useCallback((period = 'all') => {
    const now = new Date();
    return transactions.filter(tx => {
      if (period === 'all') return true;
      const txDate = new Date(tx.date);
      if (period === 'day') {
        return txDate.toDateString() === now.toDateString();
      }
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return txDate >= weekAgo;
      }
      if (period === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions]);

  // Check budget exceeded
  const getBudgetStatus = useCallback((category) => {
    const limit = budgets[category];
    if (!limit) return null;
    const spent = transactions
      .filter(tx => tx.type === 'expense' && tx.category === category)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      limit,
      spent,
      remaining: limit - spent,
      exceeded: spent > limit,
      percentage: Math.min((spent / limit) * 100, 100)
    };
  }, [transactions, budgets]);

  // Current month income (for 50/30/20)
  const monthlyIncome = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return tx.type === 'income' &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  // Current month expenses by budgeting category
  const monthlyExpensesByBudgetCategory = useMemo(() => {
    const now = new Date();
    const needsCats = ['Makanan', 'Tagihan', 'Kesehatan', 'Transportasi'];
    const wantsCats = ['Belanja', 'Hiburan', 'Pendidikan'];
    const savingsCats = ['Investasi', 'Lainnya'];

    const monthTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return tx.type === 'expense' &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    });

    const sum = (cats) => monthTx
      .filter(tx => cats.includes(tx.category))
      .reduce((s, tx) => s + tx.amount, 0);

    return {
      needs: sum(needsCats),
      wants: sum(wantsCats),
      savings: sum(savingsCats),
    };
  }, [transactions]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      budgets,
      banks,
      geminiKey,
      webhook,
      hideBalance,
      totalIncome,
      totalExpense,
      balance,
      totalBankBalance,
      monthlyIncome,
      monthlyExpensesByBudgetCategory,
      addTransaction,
      deleteTransaction,
      clearAll,
      addBank,
      deleteBank,
      updateBank,
      getBankBalance,
      setBudget,
      saveGeminiKey,
      saveWebhook,
      toggleHideBalance,
      getFilteredTransactions,
      getBudgetStatus,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export const useTransactions = () => useContext(TransactionContext);
