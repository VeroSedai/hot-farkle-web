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
          <div className="stageclear-trophy-wrap">
            <GameIcons.Trophy size={44} className="icon-gold" />
          </div>
          <h2 className="shop-title">{t('stageClear.title', { stage: clearedStage })}</h2>
          <p className="stageclear-score">
            {t('stageClear.bankLine')} <span>{bankScore}</span> / {stageTarget} {t('feedback.ptsUnit')}
          </p>
        </div>

        <div className="stageclear-breakdown">
          <div className="breakdown-row">
            <span className="breakdown-label">{t('stageClear.stageReward')}</span>
            <span className="breakdown-leader" aria-hidden="true" />
            <span className="breakdown-val">
              +{baseCoins} <GameIcons.Coins size={15} />
            </span>
          </div>

          <div className="breakdown-row">
            <div className="breakdown-label-group">
              <span>{t('stageClear.overkillBonus', { points: overkillPoints })}</span>
              <small className="breakdown-hint">
                {t('stageClear.overkillHint', {
                  perCoin: GameConfig.OverkillPointsPerCoin,
                  maxCoins: GameConfig.MaxOverkillBonusCoins,
                })}
              </small>
            </div>
            <span className="breakdown-leader" aria-hidden="true" />
            <span className="breakdown-val">
              +{overkillCoins} <GameIcons.Coins size={15} />
            </span>
          </div>

          <div className="breakdown-divider" />

          <div className="breakdown-row breakdown-total">
            <span>{t('stageClear.totalEarned', { coins: currentCoins })}</span>
            <span className="breakdown-val breakdown-val-total">
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
            <div
              className="shop-next-boss"
              style={{ borderColor: bossMeta.themeColorHex }}
            >
              <div className="boss-alert-row">
                <span
                  className="boss-alert-icon"
                  style={{
                    color: bossMeta.themeColorHex,
                    borderColor: bossMeta.themeColorHex,
                  }}
                >
                  <BossIcon boss={anteBoss} size={18} />
                </span>
                <div className="boss-alert-copy">
                  <strong style={{ color: bossMeta.themeColorHex }}>
                    {t('stageClear.bossStageTitle', {
                      stage: nextStage,
                      name: bossName,
                    })}
                  </strong>
                  <small>{bossDesc}</small>
                </div>
              </div>
            </div>
          )}
        </div>

        <button type="button" className="btn btn-gold btn-full shop-next-btn" onClick={onOpenShop}>
          <GameIcons.Play size={18} /> {t('stageClear.goToShop')}
        </button>
      </div>
    </div>
  );
};
