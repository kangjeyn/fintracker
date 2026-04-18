import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLang } from '../context/LanguageContext.jsx';

const illustrations = ['💰', '📝', '📊', '👤'];

export default function Onboarding({ onComplete }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState('');

  const steps = [
    { title: t('onboardTitle1'), desc: t('onboardDesc1'), icon: illustrations[0] },
    { title: t('onboardTitle2'), desc: t('onboardDesc2'), icon: illustrations[1] },
    { title: t('onboardTitle3'), desc: t('onboardDesc3'), icon: illustrations[2] },
    { title: t('onboardTitle4'), desc: t('onboardDesc4'), icon: illustrations[3], isNameStep: true },
  ];

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Save name before completing
      const name = userName.trim() || t('user');
      localStorage.setItem('finTracker_userName', name);
      onComplete();
    }
  };

  const isLastStep = step === steps.length - 1;
  const canProceed = !steps[step].isNameStep || userName.trim().length > 0;

  return (
    <motion.div
      className="onboarding"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <div className="onboarding-container">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          <div className="onboarding-illustration">{steps[step].icon}</div>
          <h2>{steps[step].title}</h2>
          <p>{steps[step].desc}</p>

          {/* Name input on the last step */}
          {steps[step].isNameStep && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ width: '100%', maxWidth: '300px' }}
            >
              <input
                type="text"
                className="form-input"
                placeholder={t('onboardNamePlaceholder')}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canProceed && next()}
                autoFocus
                style={{
                  textAlign: 'center',
                  fontSize: '18px',
                  padding: '16px',
                  marginBottom: '8px'
                }}
                id="onboard-name-input"
              />
            </motion.div>
          )}
        </motion.div>

        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <div key={i} className={`dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          {!isLastStep && (
            <button className="btn-skip" onClick={() => {
              localStorage.setItem('finTracker_userName', t('user'));
              onComplete();
            }}>
              {t('onboardSkip')}
            </button>
          )}
          <button
            className="btn-primary"
            onClick={next}
            disabled={!canProceed}
            style={{
              flex: 1,
              opacity: canProceed ? 1 : 0.5,
              cursor: canProceed ? 'pointer' : 'not-allowed'
            }}
          >
            {isLastStep ? t('onboardStart') : t('onboardNext')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
