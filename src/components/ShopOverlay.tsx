import React from 'react';
import { DieType } from '../core/die';
import { ConsumableType } from '../data/consumableType';
import { GameConfig } from '../data/gameConfig';
import { useI18n } from '../i18n/I18nContext';
import { ConsumableIcon, GameIcons } from './Icons';

interface ShopOverlayProps {
  currentStage: number;
  coins: number;
  remainingShields: number;
  trisBaseMultiplier: number;
  trisUpgradeCost: number;
  equippedConsumables: readonly ConsumableType[];
  offeredConsumable: ConsumableType;
  persistentPoolTypes: readonly DieType[];
  hasStandardDie: boolean;
  feedback: string;
  onBuyShield: () => void;
  onBuyConsumable: () => void;
  onSellConsumable: (slotIndex: number) => void;
  onRerollConsumable: () => void;
  onBuySpecialDie: () => void;
  onBuyTrisUpgrade: () => void;
  onNextStage: () => void;
}

export const ShopOverlay: React.FC<ShopOverlayProps> = ({
  currentStage,
  coins,
  remainingShields,
  trisBaseMultiplier,
  trisUpgradeCost,
  equippedConsumables,
  offeredConsumable,
  persistentPoolTypes,
  hasStandardDie,
  feedback,
  onBuyShield,
  onBuyConsumable,
  onSellConsumable,
  onRerollConsumable,
  onBuySpecialDie,
  onBuyTrisUpgrade,
  onNextStage,
}) => {
  const { t } = useI18n();
  const offeredName = t(`consumables.${offeredConsumable}.name`);
  const offeredDesc = t(`consumables.${offeredConsumable}.desc`);
  const beltFull = equippedConsumables.length >= GameConfig.MaxConsumableSlots;
  const shieldsFull = remainingShields >= GameConfig.MaxShields;
  const specialDiceCount = persistentPoolTypes.filter((t) => t !== DieType.Standard).length;
  const nextStage = currentStage + 1;

  return (
    <div className="modal-backdrop">
      <div className="shop-panel">
        <div className="shop-header">
          <h2 className="shop-title">{t('shop.title')}</h2>
          <div className="coins-pill large">
            <GameIcons.Coins size={20} />
            <span>{coins}</span>
          </div>
        </div>

        {equippedConsumables.length > 0 && (
          <div className="shop-status-box">
            <div className="shop-pool-bar">
              <span className="shop-status-label">
                {t('shop.belt', {
                  count: equippedConsumables.length,
                  max: GameConfig.MaxConsumableSlots,
                })}
              </span>
              <div className="pool-chips">
                {equippedConsumables.map((c, idx) => (
                  <button
                    key={`${c}-${idx}`}
                    type="button"
                    className="pool-chip chip-consumable chip-sellable"
                    onClick={() => onSellConsumable(idx)}
                    title={t('shop.sellConsumableTitle', {
                      coins: GameConfig.ShopConsumableSellValue,
                    })}
                  >
                    <ConsumableIcon type={c} size={14} /> {t(`consumables.${c}.name`)}
                    <span className="chip-sell-badge">
                      +{GameConfig.ShopConsumableSellValue} &times;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {feedback && <div className="shop-feedback">{feedback}</div>}

        <div className="shop-grid">
          <div className="shop-card shop-card-sky">
            <div className="shop-card-top">
              <GameIcons.Shield size={26} className="icon-sky" />
              <div>
                <h3>{t('shop.repairShieldTitle')}</h3>
                <p>
                  {t('shop.repairShieldDesc', {
                    count: remainingShields,
                    max: GameConfig.MaxShields,
                  })}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary shop-buy-btn"
              disabled={shieldsFull || coins < GameConfig.ShopCostRepairShield}
              onClick={onBuyShield}
            >
              {shieldsFull ? (
                t('shop.shieldMaxed')
              ) : (
                <>
                  {t('shop.buy')} &bull; {GameConfig.ShopCostRepairShield}{' '}
                  <GameIcons.Coins size={16} />
                </>
              )}
            </button>
          </div>

          <div className="shop-card shop-card-gold">
            <div className="shop-card-top">
              <ConsumableIcon type={offeredConsumable} size={26} className="icon-gold" />
              <div>
                <h3>
                  {offeredName} ({equippedConsumables.length}/{GameConfig.MaxConsumableSlots})
                </h3>
                <p>{offeredDesc}</p>
              </div>
            </div>
            <div className="shop-card-actions">
              <button
                type="button"
                className="btn btn-primary shop-buy-btn"
                disabled={beltFull || coins < GameConfig.ShopCostConsumable}
                onClick={onBuyConsumable}
              >
                {beltFull ? (
                  t('shop.beltFull')
                ) : (
                  <>
                    {t('shop.buy')} &bull; {GameConfig.ShopCostConsumable}{' '}
                    <GameIcons.Coins size={16} />
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost shop-reroll-btn"
                disabled={coins < GameConfig.ShopCostReroll}
                onClick={onRerollConsumable}
                title={t('shop.rerollTitle')}
              >
                <GameIcons.Reroll size={16} /> {t('shop.rerollBtn')} &bull;{' '}
                {GameConfig.ShopCostReroll}
              </button>
            </div>
          </div>

          <div className="shop-card shop-card-purple">
            <div className="shop-card-top">
              <GameIcons.Dice size={26} className="icon-purple" />
              <div>
                <h3>{t('shop.specialDieTitle', { count: specialDiceCount })}</h3>
                <p>{t('shop.specialDieDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary shop-buy-btn"
              disabled={!hasStandardDie || coins < GameConfig.ShopCostSpecialDie}
              onClick={onBuySpecialDie}
            >
              {hasStandardDie ? (
                <>
                  {t('shop.buy')} &bull; {GameConfig.ShopCostSpecialDie}{' '}
                  <GameIcons.Coins size={16} />
                </>
              ) : (
                t('shop.allSpecial')
              )}
            </button>
          </div>

          <div className="shop-card shop-card-orange">
            <div className="shop-card-top">
              <GameIcons.Flame size={26} className="icon-orange" />
              <div>
                <h3>{t('shop.trisTitle', { mult: trisBaseMultiplier.toFixed(1) })}</h3>
                <p>{t('shop.trisDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary shop-buy-btn"
              disabled={coins < trisUpgradeCost}
              onClick={onBuyTrisUpgrade}
            >
              {t('shop.buy')} &bull; {trisUpgradeCost}{' '}
              <GameIcons.Coins size={16} />
            </button>
          </div>
        </div>

        <button type="button" className="btn btn-gold btn-full" onClick={onNextStage}>
          {t('shop.startStage', { stage: nextStage })}
        </button>
      </div>
    </div>
  );
};
