import React from 'react';
import { Die, DieState, DieType } from '../core/die';
import { useI18n } from '../i18n/I18nContext';
import { DieView } from './DieView';

interface TutorialOverlayProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

const TUTORIAL_DIE_1 = new Die(0, 1, DieState.InPool, DieType.Standard);

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext, onSkip }) => {
  const { t } = useI18n();

  if (step < 1 || step > 4) return null;

  const isStep2 = step === 2;
  const isLast = step === 4;
  const stepKey = `tutorial.step${step}` as
    | 'tutorial.step1'
    | 'tutorial.step2'
    | 'tutorial.step3'
    | 'tutorial.step4';

  return (
    <div className={`tutorial-backdrop ${isStep2 ? 'tutorial-passthrough' : ''}`}>
      <div className={`tutorial-bubble ${isStep2 ? 'tutorial-top' : ''}`}>
        <div className="tutorial-float-die showcase-die-left">
          <DieView die={TUTORIAL_DIE_1} compact disabled />
        </div>

        <div className="tutorial-content">
          <p className="tutorial-body">{t(stepKey)}</p>

          <div className="tutorial-actions">
            <span className="tutorial-step-count">{step}/4</span>
            <div className="tutorial-btns">
              <button type="button" className="btn btn-ghost tutorial-btn" onClick={onSkip}>
                {t('tutorial.skip')}
              </button>
              <button
                type="button"
                className={`btn ${isLast ? 'btn-primary' : 'btn-gold'} tutorial-btn`}
                onClick={onNext}
              >
                {isLast ? t('tutorial.play') : t('tutorial.next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
