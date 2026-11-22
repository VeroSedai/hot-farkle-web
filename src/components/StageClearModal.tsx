import React from 'react';
import { BOSS_METADATA, BossType } from '../data/bossType';
import { GameConfig, getStageTarget, isBossStage } from '../data/gameConfig';
import { useI18n } from '../i18n/I18nContext';
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
  const { t } = useI18n();
  const baseCoins = GameConfig.StageClearBaseCoins;
  const overkillCoins = Math.max(0, totalCoinsEarned - baseCoins);
  const nextStage = clearedStage + 1;
  const nextTarget = getStageTarget(nextStage);
  const isNextBoss = isBossStage(nextStage);
  const bossMeta = BOSS_METADATA[anteBoss];
  const bossName = t(`bosses.${anteBoss}.name`);
  const bossDesc = t(`bosses.${anteBoss}.desc`);

  return (
    <div className="modal-backdrop">
      <div className="stageclear-panel">
        <div className="stageclear-header">
          <GameIcons.Trophy size={42} className="icon-gold" />
          <h2 className="shop-title">{t('stageClear.title', { stage: clearedStage })}</h2>
          <p className="stageclear-score">
            {t('stageClear.bankLine')} <span>{bankScore}</span> / {stageTarget} {t('feedback.ptsUnit')}
          </p>
        </div>

        <div className="stageclear-breakdown">
          <div className="breakdown-row">
            <span>{t('stageClear.stageReward')}</span>
            <span className="breakdown-val">
              +{baseCoins} <GameIcons.Coins size={15} />
            </span>
          </div>

          <div className="breakdown-row">
            <div>
              <span>{t('stageClear.overkillBonus', { points: overkillPoints })}</span>
              <small className="breakdown-hint">
                {t('stageClear.overkillHint', {
                  perCoin: GameConfig.OverkillPointsPerCoin,
                  maxCoins: GameConfig.MaxOverkillBonusCoins,
                })}
              </small>
            </div>
            <span className="breakdown-val">
              +{overkillCoins} <GameIcons.Coins size={15} />
            </span>
          </div>

          <div className="breakdown-divider" />

          <div className="breakdown-row breakdown-total">
            <span>{t('stageClear.totalEarned', { coins: currentCoins })}</span>
            <span className="breakdown-val">
              +{totalCoinsEarned} <GameIcons.Coins size={17} />
            </span>
          </div>
        </div>

        <div className="stageclear-next">
          <div className="next-stage-row">
            <span className="muted-label">{t('stageClear.nextStage', { stage: nextStage })}</span>
            <span className="next-target-val">{t('stageClear.target', { target: nextTarget })}</span>
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
                <BossIcon boss={anteBoss} size={16} />{' '}
                {t('stageClear.bossStageTitle', {
                  stage: nextStage,
                  name: bossName,
                })}
              </span>
              <small>{bossDesc}</small>
            </div>
          )}
        </div>

        <button type="button" className="btn btn-gold btn-full" onClick={onOpenShop}>
          {t('stageClear.goToShop')}
        </button>
      </div>
    </div>
  );
};
