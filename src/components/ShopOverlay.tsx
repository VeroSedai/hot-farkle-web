import React from 'react';
import { DieType } from '../core/die';
import { BOSS_METADATA, BossType } from '../data/bossType';
import { CONSUMABLE_METADATA, ConsumableType } from '../data/consumableType';
import { GameConfig } from '../data/gameConfig';
import { BossIcon, ConsumableIcon, GameIcons } from './Icons';

interface ShopOverlayProps {
  currentStage: number;
  anteBoss: BossType;
  coins: number;
  lastStageCoinsEarned: number;
  lastStageOverkillPoints: number;
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

const DIE_TYPE_SHORT: Record<DieType, { label: string; colorClass: string }> = {
  [DieType.Standard]: { label: 'Normale', colorClass: 'chip-std' },
  [DieType.Golden]: { label: 'Oro', colorClass: 'chip-gold' },
  [DieType.Loaded]: { label: 'Truccato', colorClass: 'chip-loaded' },
  [DieType.Multiplier]: { label: 'x2', colorClass: 'chip-mult' },
};

export const ShopOverlay: React.FC<ShopOverlayProps> = ({
  currentStage,
  anteBoss,
  coins,
  lastStageCoinsEarned,
  lastStageOverkillPoints,
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
  const nextStage = currentStage + 1;
  const nextTarget =
    nextStage >= 1 && nextStage <= GameConfig.StageTargets.length
      ? GameConfig.StageTargets[nextStage - 1]
      : GameConfig.TargetPoints;
  const isNextBoss = nextStage === GameConfig.BossStageNumber;
  const bossMeta = BOSS_METADATA[anteBoss];

  return (
    <div className="modal-backdrop">
      <div className="shop-panel">
        <div className="shop-header">
          <div>
            <h2 className="shop-title">NEGOZIO (STAGE {currentStage} SUPERATO)</h2>
            <p className="shop-reward">
              +{lastStageCoinsEarned} Monete guadagnate
              {lastStageOverkillPoints > 0 ? ` (Overkill +${lastStageOverkillPoints} pt)` : ''}
            </p>
          </div>
          <div className="coins-pill large">
            <GameIcons.Coins size={20} />
            <span>{coins}</span>
          </div>
        </div>

        {/* STATO ATTUALE: POOL DADI + CINTURA CONSUMABILI */}
        <div className="shop-status-box">
          <div className="shop-pool-bar">
            <span className="shop-status-label">I TUOI DADI:</span>
            <div className="pool-chips">
              {persistentPoolTypes.map((t, idx) => (
                <span key={idx} className={`pool-chip ${DIE_TYPE_SHORT[t].colorClass}`}>
                  {DIE_TYPE_SHORT[t].label}
                </span>
              ))}
            </div>
          </div>

          <div className="shop-pool-bar">
            <span className="shop-status-label">
              CINTURA ({equippedConsumables.length}/{GameConfig.MaxConsumableSlots}):
            </span>
            <div className="pool-chips">
              {equippedConsumables.length === 0 ? (
                <span className="shop-empty-belt">Nessun oggetto</span>
              ) : (
                equippedConsumables.map((c, idx) => (
                  <span key={`${c}-${idx}`} className="pool-chip chip-consumable">
                    <ConsumableIcon type={c} size={13} /> {CONSUMABLE_METADATA[c].displayName}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {feedback && <div className="shop-feedback">{feedback}</div>}

        <div className="shop-grid">
          <div className="shop-card">
            <div className="shop-card-tag tag-sky">DIFESA</div>
            <div className="shop-card-top">
              <GameIcons.Shield size={26} className="icon-sky" />
              <div>
                <h3>RIPARA SCUDO</h3>
                <p>+1 Scudo anti-Farkle (Attuali: {remainingShields})</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={coins < GameConfig.ShopCostRepairShield}
              onClick={onBuyShield}
            >
              COMPRA &bull; {GameConfig.ShopCostRepairShield} <GameIcons.Coins size={15} />
            </button>
          </div>

          <div className="shop-card">
            <div className="shop-card-tag tag-gold">
              CONSUMABILE ({equippedConsumables.length}/{GameConfig.MaxConsumableSlots})
            </div>
            <div className="shop-card-top">
              <ConsumableIcon type={offeredConsumable} size={26} className="icon-gold" />
              <div>
                <h3>{offeredMeta.displayName}</h3>
                <p>{offeredMeta.shortDescription}</p>
              </div>
            </div>
            <div className="shop-card-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={beltFull || coins < GameConfig.ShopCostConsumable}
                onClick={onBuyConsumable}
              >
                {beltFull ? (
                  'CINTURA PIENA'
                ) : (
                  <>
                    COMPRA &bull; {GameConfig.ShopCostConsumable} <GameIcons.Coins size={15} />
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={coins < GameConfig.ShopCostReroll}
                onClick={onRerollConsumable}
                title="Cambia il consumabile proposto"
              >
                <GameIcons.Reroll size={15} /> CAMBIA &bull; {GameConfig.ShopCostReroll}
              </button>
            </div>
          </div>

          <div className="shop-card">
            <div className="shop-card-tag tag-purple">DADO SPECIALE</div>
            <div className="shop-card-top">
              <GameIcons.Dice size={26} className="icon-purple" />
              <div>
                <h3>POTENZIA 1 DADO</h3>
                <p>Trasforma 1 dado Normale in Oro, Truccato o x2</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!hasStandardDie || coins < GameConfig.ShopCostSpecialDie}
              onClick={onBuySpecialDie}
            >
              {hasStandardDie ? (
                <>
                  COMPRA &bull; {GameConfig.ShopCostSpecialDie} <GameIcons.Coins size={15} />
                </>
              ) : (
                'TUTTI SPECIALI'
              )}
            </button>
          </div>

          <div className="shop-card">
            <div className="shop-card-tag tag-orange">PASSIVO</div>
            <div className="shop-card-top">
              <GameIcons.Flame size={26} className="icon-orange" />
              <div>
                <h3>MAESTRIA TRIS</h3>
                <p>+0.5x permanente sui Tris+ (Attuale: {trisBaseMultiplier.toFixed(1)}x)</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={coins < GameConfig.ShopCostTrisMultiplierUpgrade}
              onClick={onBuyTrisUpgrade}
            >
              COMPRA &bull; {GameConfig.ShopCostTrisMultiplierUpgrade} <GameIcons.Coins size={15} />
            </button>
          </div>
        </div>

        {isNextBoss && (
          <div className="shop-next-boss" style={{ borderColor: bossMeta.themeColorHex }}>
            <span style={{ color: bossMeta.themeColorHex, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <BossIcon boss={anteBoss} size={15} /> PROSSIMO BOSS: {bossMeta.displayName}
            </span>
            <small>{bossMeta.shortDescription}</small>
          </div>
        )}

        <button type="button" className="btn btn-gold btn-full" onClick={onNextStage}>
          AVVIA STAGE {nextStage} (OBIETTIVO: {nextTarget} PT)
        </button>
      </div>
    </div>
  );
};
