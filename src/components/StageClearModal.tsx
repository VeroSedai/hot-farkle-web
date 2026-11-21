import React from 'react';
import { BOSS_METADATA, BossType } from '../data/bossType';
import { GameConfig } from '../data/gameConfig';
import { BossIcon, GameIcons } from './Icons';

interface StageClearModalProps {
  clearedStage: number;
  bankScore: number;
  stageTarget: number;
  overkillPoints: number;
  totalCoinsEarned: number;
  currentCoins: number;
  anteBoss: BossType;
  onOpenShop: () => void;
}

export const StageClearModal: React.FC<StageClearModalProps> = ({
  clearedStage,
  bankScore,
  stageTarget,
  overkillPoints,
  totalCoinsEarned,
  currentCoins,
  anteBoss,
  onOpenShop,
}) => {
  const baseCoins = GameConfig.StageClearBaseCoins;
  const overkillCoins = Math.max(0, totalCoinsEarned - baseCoins);
  const nextStage = clearedStage + 1;
  const nextTarget =
    nextStage >= 1 && nextStage <= GameConfig.StageTargets.length
      ? GameConfig.StageTargets[nextStage - 1]
      : GameConfig.TargetPoints;
  const isNextBoss = nextStage === GameConfig.BossStageNumber;
  const bossMeta = BOSS_METADATA[anteBoss];

  return (
    <div className="modal-backdrop">
      <div className="stageclear-panel">
        <div className="stageclear-header">
          <GameIcons.Trophy size={42} className="icon-gold" />
          <h2 className="shop-title">STAGE {clearedStage} SUPERATO!</h2>
          <p className="stageclear-score">
            Banca: <span>{bankScore}</span> / {stageTarget} pt
          </p>
        </div>

        <div className="stageclear-breakdown">
          <div className="breakdown-row">
            <span>Premio Stage completato</span>
            <span className="breakdown-val">
              +{baseCoins} <GameIcons.Coins size={15} />
            </span>
          </div>

          <div className="breakdown-row">
            <div>
              <span>Bonus Overkill (+{overkillPoints} pt extra)</span>
              <small className="breakdown-hint">
                1 moneta ogni {GameConfig.OverkillPointsPerCoin} pt oltre l&apos;obiettivo
              </small>
            </div>
            <span className="breakdown-val">
              +{overkillCoins} <GameIcons.Coins size={15} />
            </span>
          </div>

          <div className="breakdown-divider" />

          <div className="breakdown-row breakdown-total">
            <span>Totale guadagnato (Saldo: {currentCoins})</span>
            <span className="breakdown-val">
              +{totalCoinsEarned} <GameIcons.Coins size={17} />
            </span>
          </div>
        </div>

        <div className="stageclear-next">
          <div className="next-stage-row">
            <span className="muted-label">PROSSIMO: STAGE {nextStage}</span>
            <span className="next-target-val">OBIETTIVO: {nextTarget} PT</span>
          </div>

          {isNextBoss && (
            <div className="shop-next-boss" style={{ borderColor: bossMeta.themeColorHex }}>
              <span
                style={{
                  color: bossMeta.themeColorHex,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <BossIcon boss={anteBoss} size={16} /> BOSS STAGE 3: {bossMeta.displayName}
              </span>
              <small>{bossMeta.shortDescription}</small>
            </div>
          )}
        </div>

        <button type="button" className="btn btn-gold btn-full" onClick={onOpenShop}>
          VAI AL NEGOZIO
        </button>
      </div>
    </div>
  );
};
