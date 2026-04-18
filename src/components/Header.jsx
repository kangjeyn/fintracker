import { useLang } from '../context/LanguageContext.jsx';
import { User } from '@phosphor-icons/react';

export default function Header({ onAvatarClick }) {
  const { lang, toggleLang, t } = useLang();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>{t('greeting')}, {localStorage.getItem('finTracker_userName') || t('user')}! 👋</h1>
          <p>{t('subtitle')}</p>
        </div>
        <div className="header-right">
          <button className="lang-badge" onClick={toggleLang} title="Toggle Language">
            {lang === 'id' ? 'EN' : 'ID'}
          </button>
          <button className="avatar-btn" onClick={onAvatarClick} aria-label="Settings">
            <User weight="bold" />
          </button>
        </div>
      </div>
    </header>
  );
}
