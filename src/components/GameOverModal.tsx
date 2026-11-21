import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { PlayerStats } from '../utils/stats';
import { GameIcons } from './Icons';

interface GameOverModalProps {
  isVictory: boolean;
  currentStage: number;
  bankScore: number;
  stageTarget: number;
  coins: number;
  stats: PlayerStats;
  onContinueEndless?: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  currentStage,
  bankScore,
  stageTarget,
  coins,
  stats,
  onContinueEndless,
  onRestart,
}) => {
  const { t } = useI18n();

  return (
    <div className="modal-backdrop">
      <div className={`gameover-panel ${isVictory ? 'victory' : 'defeat'}`}>
        <div className="gameover-icon">
          {isVictory ? <GameIcons.Trophy size={56} /> : <GameIcons.Skull size={56} />}
        </div>
        <h2>{isVictory ? t('gameOver.victoryTitle') : t('gameOver.defeatTitle')}</h2>
        <p className="gameover-sub">
          {isVictory
            ? t('gameOver.victorySub')
            : t('gameOver.defeatSub', {
                stage: currentStage,
                bank: bankScore,
                target: stageTarget,
              })}
        </p>
        <div className="gameover-stats">
          <span>
            <GameIcons.Coins size={18} /> {t('gameOver.finalCoins', { coins })}
          </span>
          <div className="gameover-records">
            <span>{t('gameOver.bestPot', { pot: stats.bestPot })}</span>
            <span>&bull;</span>
            <span>{t('gameOver.bestBank', { bank: stats.bestBank })}</span>
          </div>
        </div>
        {isVictory && onContinueEndless && (
          <button type="button" className="btn btn-primary btn-full" onClick={onContinueEndless}>
            {t('gameOver.continueEndless')}
          </button>
        )}
        <button type="button" className="btn btn-gold btn-full" onClick={onRestart}>
          {t('gameOver.newRun')}
        </button>
      </div>
    </div>
  );
};
