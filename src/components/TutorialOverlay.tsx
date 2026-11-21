import React from 'react';
import { ConsumableType } from '../data/consumableType';
import { ConsumableIcon } from './Icons';

interface TutorialOverlayProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

const TUTORIAL_TEXTS: Record<number, string> = {
  1: 'Benvenuto! Hai 4 turni per riempire la BANCA e superare lo Stage.',
  2: 'Tocca i dadi validi per metterli nel Piatto: ogni 1 = 100 pt, ogni 5 = 50 pt, e 3 uguali valgono un Tris!',
  3: 'INCASSA mette il Piatto al sicuro in Banca. TIENI & TIRA rilancia i dadi rimasti per fare più punti, ma se non esce nulla fai FARKLE e perdi il Piatto!',
  4: "Gli SCUDI ti proteggono dai Farkle, i CONSUMABILI truccano i dadi, e se blocchi tutti e 6 i dadi scatta l'HOT DICE (x2!). Buona fortuna!",
};

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext, onSkip }) => {
  if (step < 1 || step > 4) return null;

  const isStep2 = step === 2;
  const isLast = step === 4;

  return (
    <div className={`tutorial-backdrop ${isStep2 ? 'tutorial-passthrough' : ''}`}>
      <div className={`tutorial-bubble ${isStep2 ? 'tutorial-top' : ''}`}>
        <div className="tutorial-croupier">
          <ConsumableIcon type={ConsumableType.DadoJolly} size={38} className="icon-gold" />
        </div>

        <div className="tutorial-content">
          <p className="tutorial-body">{TUTORIAL_TEXTS[step]}</p>

          <div className="tutorial-actions">
            <span className="tutorial-step-count">{step}/4</span>
            <div className="tutorial-btns">
              <button type="button" className="btn btn-ghost tutorial-btn" onClick={onSkip}>
                SALTA
              </button>
              <button
                type="button"
                className={`btn ${isLast ? 'btn-primary' : 'btn-gold'} tutorial-btn`}
                onClick={onNext}
              >
                {isLast ? 'GIOCA!' : 'AVANTI >'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
