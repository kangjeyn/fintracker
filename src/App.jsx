import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header.jsx';
import BottomNavigation from './components/BottomNavigation.jsx';
import TransactionModal from './components/TransactionModal.jsx';
import Onboarding from './components/Onboarding.jsx';
import Toast from './components/Toast.jsx';
import Home from './pages/Home.jsx';
import Reports from './pages/Reports.jsx';
import AiPage from './pages/AiPage.jsx';
import Settings from './pages/Settings.jsx';
import AllTransactionsPage from './pages/AllTransactionsPage.jsx';
import AllBanksPage from './pages/AllBanksPage.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('finTracker_onboarded');
  });
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('finTracker_onboarded', 'true');
    setShowOnboarding(false);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // Sub-pages (no bottom nav)
  const isSubPage = currentPage === 'allTransactions' || currentPage === 'allBanks';

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home key="home" onNavigate={handleNavigate} showToast={showToast} />;
      case 'reports':
        return <Reports key="reports" />;
      case 'ai':
        return <AiPage key="ai" />;
      case 'settings':
        return <Settings key="settings" showToast={showToast} />;
      case 'allTransactions':
        return <AllTransactionsPage key="allTx" onBack={() => setCurrentPage('home')} />;
      case 'allBanks':
        return <AllBanksPage key="allBanks" onBack={() => setCurrentPage('home')} showToast={showToast} />;
      default:
        return <Home key="home" onNavigate={handleNavigate} showToast={showToast} />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      <div className="app-container">
        {!isSubPage && (
          <Header
            onAvatarClick={() => setCurrentPage('settings')}
          />
        )}

        <main className="app-main" id="mainContent">
          <AnimatePresence mode="wait">
            {renderPage()}
          </AnimatePresence>
        </main>

        {!isSubPage && (
          <BottomNavigation
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onFabClick={() => setShowModal(true)}
          />
        )}

        <AnimatePresence>
          {showModal && (
            <TransactionModal
              onClose={() => setShowModal(false)}
              showToast={showToast}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} />}
      </AnimatePresence>
    </>
  );
}
