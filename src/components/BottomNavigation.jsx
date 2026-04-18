import { House, ChartPieSlice, Lightbulb, GearSix, Plus } from '@phosphor-icons/react';
import { useLang } from '../context/LanguageContext.jsx';

export default function BottomNavigation({ currentPage, onPageChange, onFabClick }) {
  const { t } = useLang();

  const navItems = [
    { id: 'home', icon: House, label: t('navHome') },
    { id: 'reports', icon: ChartPieSlice, label: t('navReports') },
    { id: 'fab', isFab: true },
    { id: 'ai', icon: Lightbulb, label: t('navInsight') },
    { id: 'settings', icon: GearSix, label: t('navSettings') },
  ];

  return (
    <nav className="bottom-nav" id="bottom-navigation">
      {navItems.map(item => {
        if (item.isFab) {
          return (
            <button
              key="fab"
              className="nav-fab"
              onClick={onFabClick}
              aria-label="Add Transaction"
              id="fab-add-transaction"
            >
              <Plus weight="bold" />
            </button>
          );
        }

        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
            id={`nav-${item.id}`}
          >
            <Icon weight={currentPage === item.id ? 'fill' : 'regular'} size={24} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
