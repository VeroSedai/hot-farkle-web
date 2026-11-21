import React from 'react';
import { GameIcons } from './Icons';

interface GameOverModalProps {
  isVictory: boolean;
  currentStage: number;
  bankScore: number;
  stageTarget: number;
  coins: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  currentStage,
  bankScore,
  stageTarget,
  coins,
  onRestart,
}) => {
  return (
    <div className="modal-backdrop">
      <div className={`gameover-panel ${isVictory ? 'victory' : 'defeat'}`}>
        <div className="gameover-icon">
          {isVictory ? <GameIcons.Trophy size={56} /> : <GameIcons.Skull size={56} />}
        </div>
        <h2>{isVictory ? 'RUN COMPLETATA!' : 'RUN TERMINATA'}</h2>
        <p className="gameover-sub">
          {isVictory
            ? 'Hai sconfitto anche il Boss dello Stage 3!'
            : `Fermato allo Stage ${currentStage} (${bankScore} / ${stageTarget} pt)`}
        </p>
        <div className="gameover-stats">
          <span>
            <GameIcons.Coins size={18} /> {coins} Monete finali
          </span>
        </div>
        <button type="button" className="btn btn-gold btn-full" onClick={onRestart}>
          NUOVA RUN
        </button>
      </div>
    </div>
  );
};
