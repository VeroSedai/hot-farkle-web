import React from 'react';
import { DieType } from '../core/die';
import { CONSUMABLE_METADATA, ConsumableType } from '../data/consumableType';
import { GameConfig } from '../data/gameConfig';
import { ConsumableIcon, GameIcons } from './Icons';

interface ShopOverlayProps {
  currentStage: number;
  coins: number;
  remainingShields: number;
  trisBaseMultiplier: number;
  equippedConsumables: readonly ConsumableType[];
  offeredConsumable: ConsumableType;
  persistentPoolTypes: readonly DieType[];
  hasStandardDie: boolean;
  feedback: string;
  onBuyShield: () => void;
  onBuyConsumable: () => void;
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
  equippedConsumables,
  offeredConsumable,
  persistentPoolTypes,
  hasStandardDie,
  feedback,
  onBuyShield,
  onBuyConsumable,
  onRerollConsumable,
  onBuySpecialDie,
  onBuyTrisUpgrade,
  onNextStage,
}) => {
  const offeredMeta = CONSUMABLE_METADATA[offeredConsumable];
  const beltFull = equippedConsumables.length >= GameConfig.MaxConsumableSlots;
  const specialDiceCount = persistentPoolTypes.filter((t) => t !== DieType.Standard).length;
  const nextStage = currentStage + 1;

  return (
    <div className="modal-backdrop">
      <div className="shop-panel">
        <div className="shop-header">
          <h2 className="shop-title">NEGOZIO</h2>
          <div className="coins-pill large">
            <GameIcons.Coins size={20} />
            <span>{coins}</span>
          </div>
        </div>

        {equippedConsumables.length > 0 && (
          <div className="shop-status-box">
            <div className="shop-pool-bar">
              <span className="shop-status-label">
                CINTURA ({equippedConsumables.length}/{GameConfig.MaxConsumableSlots}):
              </span>
              <div className="pool-chips">
                {equippedConsumables.map((c, idx) => (
                  <span key={`${c}-${idx}`} className="pool-chip chip-consumable">
                    <ConsumableIcon type={c} size={14} /> {CONSUMABLE_METADATA[c].displayName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {feedback && <div className="shop-feedback">{feedback}</div>}

        <div className="shop-grid">
          <div className="shop-card">
            <div className="shop-card-top">
              <GameIcons.Shield size={26} className="icon-sky" />
              <div>
                <h3>RIPARA SCUDO</h3>
                <p>+1 Scudo anti-Farkle (Attuali: {remainingShields})</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary shop-buy-btn"
              disabled={coins < GameConfig.ShopCostRepairShield}
              onClick={onBuyShield}
            >
              COMPRA &bull; {GameConfig.ShopCostRepairShield} <GameIcons.Coins size={16} />
            </button>
          </div>

          <div className="shop-card">
            <div className="shop-card-top">
              <ConsumableIcon type={offeredConsumable} size={26} className="icon-gold" />
              <div>
                <h3>
                  {offeredMeta.displayName} ({equippedConsumables.length}/
                  {GameConfig.MaxConsumableSlots})
                </h3>
                <p>{offeredMeta.shortDescription}</p>
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
                  'CINTURA PIENA'
                ) : (
                  <>
                    COMPRA &bull; {GameConfig.ShopCostConsumable} <GameIcons.Coins size={16} />
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost shop-reroll-btn"
                disabled={coins < GameConfig.ShopCostReroll}
                onClick={onRerollConsumable}
                title="Cambia il consumabile proposto"
              >
                <GameIcons.Reroll size={16} /> CAMBIA &bull; {GameConfig.ShopCostReroll}
              </button>
            </div>
          </div>

          <div className="shop-card">
            <div className="shop-card-top">
              <GameIcons.Dice size={26} className="icon-purple" />
              <div>
                <h3>DADO SPECIALE ({specialDiceCount}/6)</h3>
                <p>Trasforma 1 dado in Oro, Truccato o x2</p>
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
                  COMPRA &bull; {GameConfig.ShopCostSpecialDie} <GameIcons.Coins size={16} />
                </>
              ) : (
                'TUTTI SPECIALI'
              )}
            </button>
          </div>

          <div className="shop-card">
            <div className="shop-card-top">
              <GameIcons.Flame size={26} className="icon-orange" />
              <div>
                <h3>TRIS +0.5x (x{trisBaseMultiplier.toFixed(1)})</h3>
                <p>Bonus fisso permanente sui Tris</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary shop-buy-btn"
              disabled={coins < GameConfig.ShopCostTrisMultiplierUpgrade}
              onClick={onBuyTrisUpgrade}
            >
              COMPRA &bull; {GameConfig.ShopCostTrisMultiplierUpgrade}{' '}
              <GameIcons.Coins size={16} />
            </button>
          </div>
        </div>

        <button type="button" className="btn btn-gold btn-full" onClick={onNextStage}>
          AVVIA STAGE {nextStage}
        </button>
      </div>
    </div>
  );
};
