import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperPlaneRight, Robot, WarningCircle, ArrowRight, Lightning, TrendUp, TrendDown, Lightbulb, X } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import { formatRp } from '../utils/formatters.js';

// Model priority: lite first (1000 req/day), then standard (500 req/day)
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

async function callGemini(apiKey, prompt) {
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      const data = await res.json();

      if (res.status === 429) {
        console.warn(`[FinTracker] ${model} rate limited. Trying next model...`);
        continue;
      }

      if (data.error) {
        console.warn(`[FinTracker] ${model} error:`, data.error.message);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { success: true, text, model };
      }
    } catch (err) {
      console.warn(`[FinTracker] ${model} fetch failed:`, err.message);
      continue;
    }
  }

  return { success: false, rateLimited: true };
}

// ========== CURATED OBSERVATIONS (Rule-based) ==========
function generateObservations(transactions, monthlyIncome, expensesByCategory, t, lang) {
  const observations = [];
  const now = new Date();

  // Get this month's expenses
  const thisMonthExpenses = transactions.filter(tx => {
    const d = new Date(tx.date);
    return tx.type === 'expense' &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  });

  // Get last month's expenses
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthExpenses = transactions.filter(tx => {
    const d = new Date(tx.date);
    return tx.type === 'expense' &&
      d.getMonth() === lastMonth.getMonth() &&
      d.getFullYear() === lastMonth.getFullYear();
  });

  const thisMonthTotal = thisMonthExpenses.reduce((s, tx) => s + tx.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((s, tx) => s + tx.amount, 0);

  // Observation 1: Monthly spending comparison
  if (lastMonthTotal > 0 && thisMonthTotal > 0) {
    const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(0);
    if (change > 10) {
      observations.push({
        icon: TrendUp,
        iconColor: '#ef4444',
        title: lang === 'id' ? 'Pengeluaran Meningkat' : 'Spending Increased',
        desc: lang === 'id'
          ? `Pengeluaran bulan ini naik ${change}% dibanding bulan lalu. Perhatikan budget kamu!`
          : `This month's spending is up ${change}% compared to last month. Watch your budget!`,
      });
    } else if (change < -10) {
      observations.push({
        icon: TrendDown,
        iconColor: '#10b981',
        title: lang === 'id' ? 'Pengeluaran Berkurang' : 'Spending Decreased',
        desc: lang === 'id'
          ? `Bagus! Pengeluaran bulan ini turun ${Math.abs(change)}% dibanding bulan lalu.`
          : `Great! This month's spending is down ${Math.abs(change)}% from last month.`,
      });
    }
  }

  // Observation 2: Top spending category
  if (thisMonthExpenses.length > 0) {
    const catMap = {};
    thisMonthExpenses.forEach(tx => {
      catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      observations.push({
        icon: Lightning,
        iconColor: '#f59e0b',
        title: lang === 'id' ? `Terbanyak: ${topCat[0]}` : `Top Spend: ${topCat[0]}`,
        desc: lang === 'id'
          ? `Kategori ${topCat[0]} adalah pengeluaran terbesar bulan ini: ${formatRp(topCat[1])}`
          : `${topCat[0]} is your biggest spend this month: ${formatRp(topCat[1])}`,
      });
    }
  }

  // Observation 3: Savings potential
  const totalNeeds = expensesByCategory.needs;
  const totalWants = expensesByCategory.wants;
  if (monthlyIncome > 0 && totalWants > monthlyIncome * 0.3) {
    const excess = totalWants - (monthlyIncome * 0.3);
    observations.push({
      icon: Lightbulb,
      iconColor: '#3b82f6',
      title: lang === 'id' ? 'Potensi Hemat' : 'Potential Savings',
      desc: lang === 'id'
        ? `Budget "Keinginan" melebihi aturan 30%. Kamu bisa hemat ${formatRp(excess)} dengan menguranginya.`
        : `Your "Wants" exceed the 30% rule. You could save ${formatRp(excess)} by cutting back.`,
    });
  }

  // Observation 4: No income yet
  if (monthlyIncome === 0 && transactions.length > 0) {
    observations.push({
      icon: TrendUp,
      iconColor: '#8b5cf6',
      title: lang === 'id' ? 'Belum Ada Pemasukan' : 'No Income Yet',
      desc: lang === 'id'
        ? 'Catat pemasukan bulan ini agar budgeting 50/30/20 bisa dihitung dengan akurat.'
        : 'Record this month\'s income so the 50/30/20 budget can be calculated accurately.',
    });
  }

  return observations;
}

// ========== AI CHAT MODAL ==========
function AiChatModal({ onClose }) {
  const { t, lang } = useLang();
  const { transactions, geminiKey } = useTransactions();
  const [messages, setMessages] = useState([
    { role: 'ai', text: t('aiWelcome') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!geminiKey) {
      setMessages(prev => [...prev, { role: 'ai', text: t('aiNoKey'), isError: true }]);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const recentTx = transactions.slice(0, 25).map(tx =>
      `${tx.date.split('T')[0]} | ${tx.type} | Rp${tx.amount.toLocaleString()} | ${tx.category} | ${tx.note}`
    ).join('\n');

    const prompt = lang === 'id'
      ? `Kamu adalah penasihat keuangan pribadi yang ramah dan profesional. Data transaksiku terbaru (maks 25):\n${recentTx || 'Belum ada data'}\nPertanyaan: ${userMsg}\nJawab dengan bahasa Indonesia yang gaul tapi profesional, singkat, padat, dan berikan tips actionable.`
      : `You are a friendly and professional personal financial advisor. My recent transactions (max 25):\n${recentTx || 'No data yet'}\nQuestion: ${userMsg}\nAnswer concisely with actionable tips.`;

    const result = await callGemini(geminiKey, prompt);

    if (result.success) {
      let aiText = result.text;
      aiText = aiText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } else if (result.rateLimited) {
      const errorMsg = lang === 'id'
        ? '⚠️ <b>Kuota API habis untuk hari ini.</b><br><br>Coba lagi nanti setelah reset (jam 14.00 WIB).'
        : '⚠️ <b>API quota exhausted for today.</b><br><br>Try again after reset (7:00 AM UTC).';
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg, isError: true }]);
    } else {
      setMessages(prev => [...prev, { role: 'ai', text: t('aiError'), isError: true }]);
    }

    setLoading(false);
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
        className="modal-content ai-chat-modal"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <h2>{t('askAiAdvisor')}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X weight="bold" />
          </button>
        </div>

        <div className="ai-messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="message-avatar">
                  {msg.isError ? <WarningCircle weight="fill" /> : <Robot weight="fill" />}
                </div>
              )}
              <div
                className="bubble"
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
            </div>
          ))}

          {loading && (
            <div className="message ai">
              <div className="message-avatar">
                <Robot weight="fill" />
              </div>
              <div className="bubble">
                <div className="thinking-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ai-input-row">
          <input
            type="text"
            placeholder={t('aiPlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            id="ai-input"
          />
          <button
            className="ai-send-btn"
            onClick={handleSend}
            disabled={loading}
            id="ai-send-btn"
          >
            <PaperPlaneRight weight="fill" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ========== MAIN INSIGHT PAGE ==========
export default function AiPage() {
  const { t, lang } = useLang();
  const { transactions, geminiKey, monthlyIncome, monthlyExpensesByBudgetCategory } = useTransactions();
  const [showChat, setShowChat] = useState(false);

  // 50/30/20 calculations
  const budgetNeeds = monthlyIncome * 0.5;
  const budgetWants = monthlyIncome * 0.3;
  const budgetSavings = monthlyIncome * 0.2;

  const needsSpent = monthlyExpensesByBudgetCategory.needs;
  const wantsSpent = monthlyExpensesByBudgetCategory.wants;
  const savingsSpent = monthlyExpensesByBudgetCategory.savings;

  const needsPct = budgetNeeds > 0 ? Math.min((needsSpent / budgetNeeds) * 100, 100) : 0;
  const wantsPct = budgetWants > 0 ? Math.min((wantsSpent / budgetWants) * 100, 100) : 0;
  const savingsPct = budgetSavings > 0 ? Math.min((savingsSpent / budgetSavings) * 100, 100) : 0;

  // Generate observations
  const observations = useMemo(() => {
    return generateObservations(transactions, monthlyIncome, monthlyExpensesByBudgetCategory, t, lang);
  }, [transactions, monthlyIncome, monthlyExpensesByBudgetCategory, t, lang]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="insight-page-header">
        <h2>{t('insightTitle')}</h2>
        <p>{t('insightSubtitle')}</p>
      </div>

      {/* 50/30/20 Guideline Card */}
      <motion.div
        className="glass-panel insight-budget-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="insight-budget-header">
          <h3>{t('budgetGuideline')}</h3>
          <div className="insight-budget-badge">50/30/20</div>
        </div>

        {monthlyIncome === 0 ? (
          <div className="insight-no-income">
            <p>{t('insightNoIncome')}</p>
          </div>
        ) : (
          <div className="insight-budget-bars">
            {/* Needs */}
            <div className="insight-bar-row">
              <div className="insight-bar-label">
                <span className="insight-dot needs" />
                <span>{t('budgetNeeds')} (50%)</span>
              </div>
              <span className="insight-bar-amount">{formatRp(needsSpent)} / {formatRp(budgetNeeds)}</span>
            </div>
            <div className="insight-bar-track">
              <motion.div
                className={`insight-bar-fill needs ${needsPct > 90 ? 'danger' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${needsPct}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {/* Wants */}
            <div className="insight-bar-row">
              <div className="insight-bar-label">
                <span className="insight-dot wants" />
                <span>{t('budgetWants')} (30%)</span>
              </div>
              <span className="insight-bar-amount">{formatRp(wantsSpent)} / {formatRp(budgetWants)}</span>
            </div>
            <div className="insight-bar-track">
              <motion.div
                className={`insight-bar-fill wants ${wantsPct > 90 ? 'danger' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${wantsPct}%` }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {/* Savings */}
            <div className="insight-bar-row">
              <div className="insight-bar-label">
                <span className="insight-dot savings" />
                <span>{t('budgetSavings')} (20%)</span>
              </div>
              <span className="insight-bar-amount">{formatRp(savingsSpent)} / {formatRp(budgetSavings)}</span>
            </div>
            <div className="insight-bar-track">
              <motion.div
                className={`insight-bar-fill savings ${savingsPct > 90 ? 'danger' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${savingsPct}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Ask AI Advisor CTA */}
      <motion.button
        className="insight-ai-cta"
        onClick={() => setShowChat(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        id="btn-open-ai-chat"
      >
        <div className="insight-ai-cta-left">
          <div className="insight-ai-icon">
            <Robot weight="fill" size={24} />
          </div>
          <div>
            <h4>{t('askAiAdvisor')}</h4>
            <p>{t('askAiDesc')}</p>
          </div>
        </div>
        <div className="insight-ai-cta-right">
          {geminiKey && <span className="insight-active-badge">{t('active')}</span>}
          <ArrowRight weight="bold" size={20} />
        </div>
      </motion.button>

      {/* Curated Observations */}
      {observations.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: '8px' }}>
            <h3>{t('curatedObservations')}</h3>
          </div>

          {observations.map((obs, i) => {
            const Icon = obs.icon;
            return (
              <motion.div
                key={i}
                className="glass-panel insight-observation"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <div className="insight-obs-icon" style={{ background: `${obs.iconColor}18`, color: obs.iconColor }}>
                  <Icon weight="fill" size={22} />
                </div>
                <div className="insight-obs-content">
                  <h4>{obs.title}</h4>
                  <p>{obs.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </>
      )}

      {/* Empty state if no observations & no income */}
      {observations.length === 0 && monthlyIncome === 0 && transactions.length === 0 && (
        <div className="empty-state" style={{ marginTop: '20px' }}>
          <div className="empty-state-icon">📊</div>
          <p>{t('insightEmpty')}</p>
        </div>
      )}

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <AiChatModal onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
