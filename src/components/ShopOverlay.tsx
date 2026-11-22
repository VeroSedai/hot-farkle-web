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
          <div className="shop-title-group">
            <h2 className="shop-title">{t('shop.title')}</h2>
            <span className="shop-stage-pill">
              S{currentStage} &rarr; S{nextStage}
            </span>
          </div>
          <div className="coins-pill large">
            <GameIcons.Coins size={20} />
            <span>{coins}</span>
          </div>
        </div>

        {/* LOADOUT BAR: 6 dice composition + fixed consumable belt slots */}
        <div className="shop-loadout-bar">
          <div className="shop-loadout-section">
            <span className="shop-status-label">
              <GameIcons.Dice size={13} /> {specialDiceCount}/6
            </span>
            <div className="shop-dice-strip">
              {persistentPoolTypes.map((dieType, idx) => {
                const typeClass =
                  dieType === DieType.Golden
                    ? 'mini-die-gold'
                    : dieType === DieType.Loaded
                      ? 'mini-die-loaded'
                      : dieType === DieType.Multiplier
                        ? 'mini-die-mult'
                        : 'mini-die-std';
                const label =
                  dieType === DieType.Golden
                    ? t('shopFeedback.dieGolden')
                    : dieType === DieType.Loaded
                      ? t('shopFeedback.dieLoaded')
                      : dieType === DieType.Multiplier
                        ? t('shopFeedback.dieMultiplier')
                        : 'Standard';
                return (
                  <span
                    key={idx}
                    className={`shop-mini-die ${typeClass}`}
                    title={label}
                    aria-label={label}
                  >
                    <span className="shop-mini-pip" />
                  </span>
                );
              })}
            </div>
          </div>

          <div className="shop-loadout-divider" aria-hidden="true" />

          <div className="shop-loadout-section shop-belt-section">
            <span className="shop-status-label">
              {t('shop.belt', {
                count: equippedConsumables.length,
                max: GameConfig.MaxConsumableSlots,
              })}
            </span>
            <div className="pool-chips">
              {Array.from({ length: GameConfig.MaxConsumableSlots }, (_, idx) => {
                const c = equippedConsumables[idx];
                if (c) {
                  return (
                    <button
                      key={`${c}-${idx}`}
                      type="button"
                      className="pool-chip chip-consumable chip-sellable"
                      onClick={() => onSellConsumable(idx)}
                      title={t('shop.sellConsumableTitle', {
                        coins: GameConfig.ShopConsumableSellValue,
                      })}
                    >
                      <ConsumableIcon type={c} size={13} /> {t(`consumables.${c}.name`)}
                      <span className="chip-sell-badge">
                        +{GameConfig.ShopConsumableSellValue} &times;
                      </span>
                    </button>
                  );
                }
                return (
                  <span key={`empty-belt-${idx}`} className="pool-chip chip-belt-empty">
                    &mdash;
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {feedback && <div className="shop-feedback">{feedback}</div>}

        <div className="shop-grid">
          <div className="shop-card shop-card-sky">
            <div className="shop-card-top">
              <div className="shop-icon-medallion medallion-sky">
                <GameIcons.Shield size={24} className="icon-sky" />
              </div>
              <div className="shop-card-copy">
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
              className={`btn ${shieldsFull ? 'btn-shop-maxed' : 'btn-primary'} shop-buy-btn`}
              disabled={shieldsFull || coins < GameConfig.ShopCostRepairShield}
              onClick={onBuyShield}
            >
              {shieldsFull ? (
                t('shop.shieldMaxed')
              ) : (
                <>
                  <span>{t('shop.buy')}</span>
                  <span className="shop-price-pill">
                    {GameConfig.ShopCostRepairShield} <GameIcons.Coins size={13} />
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="shop-card shop-card-gold">
            <div className="shop-card-top">
              <div className="shop-icon-medallion medallion-gold">
                <ConsumableIcon type={offeredConsumable} size={24} className="icon-gold" />
              </div>
              <div className="shop-card-copy">
                <h3>
                  {offeredName} ({equippedConsumables.length}/{GameConfig.MaxConsumableSlots})
                </h3>
                <p>{offeredDesc}</p>
              </div>
            </div>
            <div className="shop-card-actions">
              <button
                type="button"
                className={`btn ${beltFull ? 'btn-shop-maxed' : 'btn-primary'} shop-buy-btn`}
                disabled={beltFull || coins < GameConfig.ShopCostConsumable}
                onClick={onBuyConsumable}
              >
                {beltFull ? (
                  t('shop.beltFull')
                ) : (
                  <>
                    <span>{t('shop.buy')}</span>
                    <span className="shop-price-pill">
                      {GameConfig.ShopCostConsumable} <GameIcons.Coins size={13} />
                    </span>
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
                <GameIcons.Reroll size={15} />
                <span className="shop-price-pill shop-price-pill-muted">
                  {GameConfig.ShopCostReroll} <GameIcons.Coins size={12} />
                </span>
              </button>
            </div>
          </div>

          <div className="shop-card shop-card-purple">
            <div className="shop-card-top">
              <div className="shop-icon-medallion medallion-purple">
                <GameIcons.Dice size={24} className="icon-purple" />
              </div>
              <div className="shop-card-copy">
                <h3>{t('shop.specialDieTitle', { count: specialDiceCount })}</h3>
                <p>{t('shop.specialDieDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              className={`btn ${!hasStandardDie ? 'btn-shop-maxed' : 'btn-primary'} shop-buy-btn`}
              disabled={!hasStandardDie || coins < GameConfig.ShopCostSpecialDie}
              onClick={onBuySpecialDie}
            >
              {hasStandardDie ? (
                <>
                  <span>{t('shop.buy')}</span>
                  <span className="shop-price-pill">
                    {GameConfig.ShopCostSpecialDie} <GameIcons.Coins size={13} />
                  </span>
                </>
              ) : (
                t('shop.allSpecial')
              )}
            </button>
          </div>

          <div className="shop-card shop-card-orange">
            <div className="shop-card-top">
              <div className="shop-icon-medallion medallion-orange">
                <GameIcons.Flame size={24} className="icon-orange" />
              </div>
              <div className="shop-card-copy">
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
              <span>{t('shop.buy')}</span>
              <span className="shop-price-pill">
                {trisUpgradeCost} <GameIcons.Coins size={13} />
              </span>
            </button>
          </div>
        </div>

        <button type="button" className="btn btn-gold btn-full shop-next-btn" onClick={onNextStage}>
          <GameIcons.Play size={18} /> {t('shop.startStage', { stage: nextStage })}
        </button>
      </div>
    </div>
  );
};
