import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Globe, Key, Link as LinkIcon, Trash, FilePdf, Wallet, DownloadSimple, UploadSimple, DeviceMobile, Bank } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useTransactions } from '../context/TransactionContext.jsx';
import { CATEGORIES, formatRp } from '../utils/formatters.js';

export default function Settings({ showToast }) {
  const { t, lang, toggleLang } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const {
    geminiKey, webhook, budgets, banks,
    saveGeminiKey, saveWebhook, clearAll,
    setBudget, getBudgetStatus, transactions,
    deleteBank, updateBank
  } = useTransactions();

  const [apiKeyInput, setApiKeyInput] = useState(geminiKey);
  const [webhookInput, setWebhookInput] = useState(webhook);
  const [budgetCategory, setBudgetCategory] = useState('Makanan');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [editingBank, setEditingBank] = useState(null);
  const [editBalance, setEditBalance] = useState('');

  const handleSaveApiKey = () => {
    saveGeminiKey(apiKeyInput);
    showToast?.('🔑 ' + t('apiKeySaved'));
  };

  const handleSaveWebhook = () => {
    saveWebhook(webhookInput);
    showToast?.('🔗 ' + t('webhookSaved'));
  };

  const handleClearAll = () => {
    if (confirm(t('clearConfirm'))) {
      clearAll();
      showToast?.('🗑️ ' + t('clearSuccess'));
    }
  };

  const handleSetBudget = () => {
    if (!budgetAmount) return;
    setBudget(budgetCategory, parseInt(budgetAmount));
    setBudgetAmount('');
    showToast?.('📊 Budget set!');
  };

  const handleDeleteBank = (bankId, bankName) => {
    if (confirm(t('deleteBankConfirm').replace('{name}', bankName))) {
      deleteBank(bankId);
      showToast?.('🗑️ ' + t('bankDeleted'));
    }
  };

  const handleUpdateBankBalance = (bankId) => {
    if (!editBalance) return;
    updateBank(bankId, { initialBalance: parseInt(editBalance) });
    setEditingBank(null);
    setEditBalance('');
    showToast?.('✅ ' + t('bankUpdated'));
  };

  // Export data as JSON file
  const handleExportJson = () => {
    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      userName: localStorage.getItem('finTracker_userName') || '',
      transactions,
      budgets,
      banks,
      settings: {
        theme: localStorage.getItem('finTracker_theme') || 'dark',
        language: localStorage.getItem('finTracker_lang') || 'id',
        webhookUrl: webhook,
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.('💾 ' + t('exportJsonSuccess'));
  };

  // Import data from JSON file
  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);

          if (!data.transactions || !Array.isArray(data.transactions)) {
            showToast?.('❌ ' + t('importError'));
            return;
          }

          // Confirm before overwriting
          if (!confirm(t('importConfirm'))) return;

          // Restore transactions
          localStorage.setItem('finTracker_tx', JSON.stringify(data.transactions));

          // Restore budgets
          if (data.budgets) {
            localStorage.setItem('finTracker_budgets', JSON.stringify(data.budgets));
          }

          // Restore banks
          if (data.banks) {
            localStorage.setItem('finTracker_banks', JSON.stringify(data.banks));
          }

          // Restore settings
          if (data.userName) {
            localStorage.setItem('finTracker_userName', data.userName);
          }
          if (data.settings?.theme) {
            localStorage.setItem('finTracker_theme', data.settings.theme);
          }
          if (data.settings?.language) {
            localStorage.setItem('finTracker_lang', data.settings.language);
          }

          showToast?.('✅ ' + t('importSuccess'));

          // Reload to apply changes
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          showToast?.('❌ ' + t('importError'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Install PWA prompt
  const handleInstallPWA = () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          showToast?.('📱 App installed!');
        }
        window.deferredPrompt = null;
      });
    } else {
      showToast?.('💡 ' + t('installHint'));
    }
  };

  const handleExportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('FinTracker Report', 14, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableData = transactions.slice(0, 50).map(tx => [
        tx.date.split('T')[0],
        tx.type === 'income' ? 'Income' : 'Expense',
        tx.category,
        tx.note,
        formatRp(tx.amount)
      ]);

      doc.autoTable({
        startY: 38,
        head: [['Date', 'Type', 'Category', 'Note', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 }
      });

      doc.save('fintracker-report.pdf');
      showToast?.('📄 ' + t('exportSuccess'));
    } catch (err) {
      console.error(err);
      showToast?.('❌ Export failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="section-header">
        <h3>{t('settingsTitle')}</h3>
      </div>

      {/* Appearance & Language */}
      <div className="glass-panel">
        <div className="settings-row">
          <div className="settings-row-left">
            <div className="settings-icon">
              {isDark ? <Moon weight="fill" /> : <Sun weight="fill" />}
            </div>
            <span className="settings-label">{isDark ? t('darkMode') : t('lightMode')}</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={isDark} onChange={toggleTheme} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-left">
            <div className="settings-icon"><Globe weight="fill" /></div>
            <span className="settings-label">{t('language')}</span>
          </div>
          <button className="lang-badge" onClick={toggleLang}>
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div className="settings-row-left">
            <div className="settings-icon"><DeviceMobile weight="fill" /></div>
            <span className="settings-label">{t('installApp')}</span>
          </div>
          <button className="lang-badge" onClick={handleInstallPWA}>
            Install
          </button>
        </div>
      </div>

      {/* Manage Banks */}
      <div className="glass-panel">
        <div className="section-header" style={{ margin: '0 0 14px' }}>
          <h3><Bank weight="bold" style={{ marginRight: 6 }} />{t('manageBanks')}</h3>
        </div>

        {banks.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {t('noBanks')}
          </p>
        ) : (
          banks.map(bank => (
            <div key={bank.id} className="settings-bank-item">
              <div className="settings-bank-left">
                <div className="settings-bank-dot" style={{ background: bank.color }} />
                <div>
                  <div className="settings-bank-name">{bank.name} {bank.lastFour ? `•••• ${bank.lastFour}` : ''}</div>
                  <div className="settings-bank-balance">{t('initialBalance')}: {formatRp(bank.initialBalance || 0)}</div>
                </div>
              </div>
              <div className="settings-bank-actions">
                {editingBank === bank.id ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      placeholder="Saldo baru"
                      style={{ width: '120px', padding: '8px', fontSize: '13px' }}
                    />
                    <button
                      className="lang-badge"
                      onClick={() => handleUpdateBankBalance(bank.id)}
                      style={{ fontSize: '11px' }}
                    >
                      ✓
                    </button>
                    <button
                      className="lang-badge"
                      onClick={() => { setEditingBank(null); setEditBalance(''); }}
                      style={{ fontSize: '11px', background: 'var(--expense-bg)', color: 'var(--expense)' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="lang-badge"
                      onClick={() => { setEditingBank(bank.id); setEditBalance(bank.initialBalance?.toString() || '0'); }}
                      style={{ fontSize: '11px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="lang-badge"
                      onClick={() => handleDeleteBank(bank.id, bank.name)}
                      style={{ fontSize: '11px', background: 'var(--expense-bg)', color: 'var(--expense)' }}
                    >
                      <Trash weight="bold" size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* API Key */}
      <div className="glass-panel">
        <div className="form-group">
          <label><Key weight="bold" style={{ marginRight: 6 }} />{t('apiKeyLabel')}</label>
          <input
            type="password"
            className="form-input"
            placeholder={t('apiKeyPlaceholder')}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            id="settings-api-key"
          />
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
            {t('apiKeyHint')}
          </p>
        </div>
        <button className="btn-secondary" onClick={handleSaveApiKey}>{t('saveApiKey')}</button>
      </div>

      {/* Webhook */}
      <div className="glass-panel">
        <div className="form-group">
          <label><LinkIcon weight="bold" style={{ marginRight: 6 }} />{t('webhookLabel')}</label>
          <input
            type="text"
            className="form-input"
            placeholder={t('webhookPlaceholder')}
            value={webhookInput}
            onChange={(e) => setWebhookInput(e.target.value)}
            id="settings-webhook"
          />
        </div>
        <button className="btn-secondary" onClick={handleSaveWebhook}>{t('syncSheet')}</button>
      </div>

      {/* Budget Limits */}
      <div className="glass-panel">
        <div className="section-header" style={{ margin: '0 0 14px' }}>
          <h3><Wallet weight="bold" style={{ marginRight: 6 }} />{t('budgetTitle')}</h3>
        </div>

        {/* Budget input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <select
            className="form-input"
            value={budgetCategory}
            onChange={(e) => setBudgetCategory(e.target.value)}
            style={{ flex: 1 }}
          >
            {CATEGORIES.filter(c => c.value !== 'Gaji').map(c => (
              <option key={c.value} value={c.value}>{c.icon} {t(c.key)}</option>
            ))}
          </select>
          <input
            type="number"
            className="form-input"
            placeholder={t('budgetPlaceholder')}
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={handleSetBudget} style={{ width: 'auto', padding: '10px 16px', fontSize: '13px' }}>
            {t('budgetSet')}
          </button>
        </div>

        {/* Budget bars */}
        {Object.keys(budgets).length > 0 ? (
          Object.keys(budgets).map(cat => {
            const status = getBudgetStatus(cat);
            if (!status) return null;
            const fillClass = status.percentage > 90 ? 'danger' : status.percentage > 70 ? 'warning' : 'safe';
            return (
              <div key={cat} className="budget-item">
                <div className="budget-header">
                  <span>{cat}</span>
                  <span style={{ color: status.exceeded ? 'var(--expense)' : 'var(--text-secondary)', fontSize: '12px' }}>
                    {formatRp(status.spent)} / {formatRp(status.limit)}
                  </span>
                </div>
                <div className="budget-bar">
                  <div className={`budget-fill ${fillClass}`} style={{ width: `${status.percentage}%` }} />
                </div>
                {status.exceeded && (
                  <p style={{ fontSize: '11px', color: 'var(--expense)', marginTop: '4px' }}>
                    ⚠️ {t('budgetExceeded')}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {t('noBudget')}
          </p>
        )}
      </div>

      {/* Data Management */}
      <div className="glass-panel">
        <div className="section-header" style={{ margin: '0 0 14px' }}>
          <h3>{t('dataManagement')}</h3>
        </div>

        <button className="btn-secondary" onClick={handleExportJson} style={{ marginBottom: '10px' }}>
          <DownloadSimple weight="bold" style={{ marginRight: 6 }} />
          {t('exportJson')}
        </button>

        <button className="btn-secondary" onClick={handleImportJson} style={{ marginBottom: '10px' }}>
          <UploadSimple weight="bold" style={{ marginRight: 6 }} />
          {t('importJson')}
        </button>

        <button className="btn-secondary" onClick={handleExportPdf} style={{ marginBottom: '10px' }}>
          <FilePdf weight="bold" style={{ marginRight: 6 }} />
          {t('exportPdf')}
        </button>

        <button className="btn-danger" onClick={handleClearAll}>
          <Trash weight="bold" style={{ marginRight: 6 }} />
          {t('clearAll')}
        </button>
      </div>

      {/* Version Info */}
      <div style={{ textAlign: 'center', padding: '16px 0 8px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
        FinTracker v2.0.0 — Made with 💙
      </div>
    </motion.div>
  );
}
