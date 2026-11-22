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
  const defeatPercent = Math.min(100, Math.round((bankScore / Math.max(1, stageTarget)) * 100));

  return (
    <div className="modal-backdrop">
      <div className={`gameover-panel ${isVictory ? 'victory' : 'defeat'}`}>
        <div className="gameover-medallion">
          <div className="gameover-icon">
            {isVictory ? <GameIcons.Trophy size={48} /> : <GameIcons.Skull size={48} />}
          </div>
        </div>
        <h2 className="gameover-title">
          {isVictory ? t('gameOver.victoryTitle') : t('gameOver.defeatTitle')}
        </h2>
        <p className="gameover-sub">
          {isVictory
            ? t('gameOver.victorySub')
            : t('gameOver.defeatSub', {
                stage: currentStage,
                bank: bankScore,
                target: stageTarget,
              })}
        </p>

        {!isVictory && (
          <div className="gameover-progress-box">
            <div className="gameover-progress-head">
              <span>{t('hud.bankStage', { stage: currentStage })}</span>
              <span className="gameover-progress-pct">{defeatPercent}%</span>
            </div>
            <div className="gameover-progress-track">
              <div className="gameover-progress-fill" style={{ width: `${defeatPercent}%` }} />
            </div>
          </div>
        )}

        <div className="gameover-stat-grid">
          <div className="gameover-stat-tile">
            <span className="gameover-stat-val">
              <GameIcons.Coins size={16} /> {coins}
            </span>
            <span className="gameover-stat-lbl">{t('hud.coinsTitle')}</span>
          </div>
          <div className="gameover-stat-tile">
            <span className="gameover-stat-val">{stats.bestPot}</span>
            <span className="gameover-stat-lbl">{t('home.statsBestPot')}</span>
          </div>
          <div className="gameover-stat-tile">
            <span className="gameover-stat-val">{stats.bestBank}</span>
            <span className="gameover-stat-lbl">{t('home.statsBestBank')}</span>
          </div>
        </div>

        {isVictory && onContinueEndless && (
          <button type="button" className="btn btn-primary btn-full" onClick={onContinueEndless}>
            <GameIcons.Play size={18} /> {t('gameOver.continueEndless')}
          </button>
        )}
        <button type="button" className="btn btn-gold btn-full" onClick={onRestart}>
          <GameIcons.Reroll size={18} /> {t('gameOver.newRun')}
        </button>
      </div>
    </div>
  );
};
