export const formatRp = (num) => {
  const absNum = Math.abs(num);
  return 'Rp ' + absNum.toLocaleString('id-ID');
};

export const formatDate = (isoStr, lang = 'id') => {
  const date = new Date(isoStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return lang === 'id' ? 'Hari Ini' : 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return lang === 'id' ? 'Kemarin' : 'Yesterday';
  }

  return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatTime = (isoStr) => {
  return new Date(isoStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const CATEGORIES = [
  { key: 'catFood', icon: '🍔', value: 'Makanan', color: '#ef4444' },
  { key: 'catTransport', icon: '🚗', value: 'Transportasi', color: '#f59e0b' },
  { key: 'catShopping', icon: '🛍️', value: 'Belanja', color: '#3b82f6' },
  { key: 'catBills', icon: '📄', value: 'Tagihan', color: '#8b5cf6' },
  { key: 'catEntertainment', icon: '🎮', value: 'Hiburan', color: '#ec4899' },
  { key: 'catSalary', icon: '💰', value: 'Gaji', color: '#10b981' },
  { key: 'catHealth', icon: '🏥', value: 'Kesehatan', color: '#14b8a6' },
  { key: 'catEducation', icon: '📚', value: 'Pendidikan', color: '#6366f1' },
  { key: 'catInvestment', icon: '📈', value: 'Investasi', color: '#0ea5e9' },
  { key: 'catOther', icon: '📦', value: 'Lainnya', color: '#64748b' },
];

export const getCategoryInfo = (value) => {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
};

export const CHART_COLORS = [
  '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899',
  '#10b981', '#14b8a6', '#6366f1', '#0ea5e9', '#64748b'
];
