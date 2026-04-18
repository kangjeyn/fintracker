import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import { CATEGORIES, CHART_COLORS } from '../utils/formatters.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export default function Reports() {
  const { t } = useLang();
  const { transactions, getFilteredTransactions } = useTransactions();
  const [period, setPeriod] = useState('all');

  const filtered = getFilteredTransactions(period);

  // Expense by category (Doughnut)
  const expenseData = useMemo(() => {
    const expenses = filtered.filter(tx => tx.type === 'expense');
    const map = {};
    expenses.forEach(tx => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });

    const labels = Object.keys(map);
    const colors = labels.map(label => {
      const cat = CATEGORIES.find(c => c.value === label);
      return cat?.color || '#64748b';
    });

    return {
      labels,
      datasets: [{
        data: Object.values(map),
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 10,
      }]
    };
  }, [filtered]);

  // Monthly trend (Bar)
  const monthlyData = useMemo(() => {
    const months = {};
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      if (tx.type === 'income') months[key].income += tx.amount;
      else months[key].expense += tx.amount;
    });

    const sortedKeys = Object.keys(months).sort().slice(-6);
    const monthNames = sortedKeys.map(k => {
      const [y, m] = k.split('-');
      return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'short' });
    });

    return {
      labels: monthNames,
      datasets: [
        {
          label: t('income'),
          data: sortedKeys.map(k => months[k].income),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: t('expense'),
          data: sortedKeys.map(k => months[k].expense),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    };
  }, [transactions, t]);

  // Balance trend (Line)
  const trendData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    const points = sorted.map(tx => {
      running += tx.type === 'income' ? tx.amount : -tx.amount;
      return { x: new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), y: running };
    });

    const last15 = points.slice(-15);

    return {
      labels: last15.map(p => p.x),
      datasets: [{
        label: 'Balance',
        data: last15.map(p => p.y),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
      }]
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'var(--text-secondary)',
          font: { family: 'Outfit', size: 12 },
          padding: 16,
          usePointStyle: true,
        }
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: '68%',
    plugins: {
      ...chartOptions.plugins,
      legend: { ...chartOptions.plugins.legend, position: 'right' }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }, grid: { display: false } },
      y: { ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 }, maxRotation: 45 }, grid: { display: false } },
      y: { ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  const hasExpenses = expenseData.labels.length > 0;
  const hasMonthly = monthlyData.labels.length > 0;
  const hasTrend = trendData.labels.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      {/* Period Filter */}
      <div className="filter-tabs">
        {['day', 'week', 'month', 'all'].map(p => (
          <button
            key={p}
            className={`filter-tab ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {t(`filter${p.charAt(0).toUpperCase() + p.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* Expense Doughnut */}
      <div className="section-header">
        <h3>{t('expenseAnalysis')}</h3>
      </div>
      <div className="glass-panel">
        {hasExpenses ? (
          <div className="chart-container">
            <Doughnut data={expenseData} options={doughnutOptions} />
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('noExpenseData')}</p>
          </div>
        )}
      </div>

      {/* Monthly Bar Chart */}
      <div className="section-header">
        <h3>{t('monthlyTrend')}</h3>
      </div>
      <div className="glass-panel">
        {hasMonthly ? (
          <div className="chart-container">
            <Bar data={monthlyData} options={barOptions} />
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('noExpenseData')}</p>
          </div>
        )}
      </div>

      {/* Balance Trend Line */}
      {hasTrend && (
        <>
          <div className="section-header">
            <h3>Balance Trend</h3>
          </div>
          <div className="glass-panel">
            <div className="chart-container">
              <Line data={trendData} options={lineOptions} />
            </div>
          </div>
        </>
      )}

      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('chartDescription')}
        </p>
      </div>
    </motion.div>
  );
}
