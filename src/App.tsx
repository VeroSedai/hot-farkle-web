import React, { useEffect, useRef, useState } from 'react';
import { DieView } from './components/DieView';
import { GameOverModal } from './components/GameOverModal';
import { HomeScreen } from './components/HomeScreen';
import { BossIcon, ConsumableIcon, GameIcons } from './components/Icons';
import { RulesModal } from './components/RulesModal';
import { ShopOverlay } from './components/ShopOverlay';
import { StageClearModal } from './components/StageClearModal';
import { SwirlBackground } from './components/SwirlBackground';
import { DieState, DieType } from './core/die';
import { FarkleGameManager } from './core/farkleGameManager';
import { BOSS_METADATA } from './data/bossType';
import { CONSUMABLE_METADATA } from './data/consumableType';
import { GameConfig } from './data/gameConfig';
import { soundManager } from './utils/audio';

export const App: React.FC = () => {
  const gmRef = useRef<FarkleGameManager | null>(null);
  if (!gmRef.current) {
    const gm = new FarkleGameManager();
    gm.deferFarkleTurnAdvance = true;
    gm.startNewRun();
    gmRef.current = gm;
  }
  const gm = gmRef.current;

  const [screen, setScreen] = useState<'home' | 'game'>('home');
  const [, setTick] = useState(0);
  const [targetingSlot, setTargetingSlot] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showStageClear, setShowStageClear] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isRollingAnim, setIsRollingAnim] = useState(false);
  const [feedback, setFeedback] = useState<string>('Seleziona i dadi per fare punti');
  const [shopFeedback, setShopFeedback] = useState<string>('');

  const forceUpdate = () => setTick((t) => t + 1);

  const triggerRollAnim = () => {
    soundManager.playRoll();
    setIsRollingAnim(true);
    window.setTimeout(() => setIsRollingAnim(false), 280);
  };

  useEffect(() => {
    const unsubState = gm.on('stateChanged', forceUpdate);
    const unsubHotDice = gm.on('hotDice', () => {
      setFeedback(`HOT DICE! Moltiplicatore ${gm.multiplier}x!`);
    });
    const unsubGrace = gm.on('graceRoll', () => {
      setFeedback('GRACE ROLL! Primo tiro salvato!');
    });
    const unsubShop = gm.on('shopOpened', () => {
      setShowStageClear(true);
    });
    const unsubFarkle = gm.on('farkle', () => {
      if (gm.lastFarkleUsedClover) {
        setFeedback('TRIFOGLIO! Farkle annullato, rilancio gratuito!');
      } else if (gm.lastFarkleConsumedShield) {
        setFeedback('FARKLE! Scudo consumato, rilancio gratuito!');
      } else {
        setFeedback('FARKLE! Piatto perso!');
      }
      window.setTimeout(() => {
        gm.completePendingFarkleTurn();
        triggerRollAnim();
      }, 1150);
    });

    return () => {
      unsubState();
      unsubHotDice();
      unsubGrace();
      unsubShop();
      unsubFarkle();
    };
  }, [gm]);

  const lockedAndFrozenDice = gm.dice.filter(
    (d) => d.state === DieState.Locked || d.state === DieState.Frozen
  );

  const activeDice = gm.dice.filter(
    (d) => d.state === DieState.InPool || d.state === DieState.Selected
  );

  const handleStartFromHome = () => {
    soundManager.unlock();
    setTargetingSlot(null);
    setShopFeedback('');
    gm.startNewRun();
    setScreen('game');
    triggerRollAnim();
    setFeedback('Seleziona i dadi per fare punti');
  };

  const handleDieClick = (dieId: number) => {
    soundManager.unlock();
    if (targetingSlot !== null) {
      const ok = gm.useTargetedConsumable(targetingSlot, dieId);
      setTargetingSlot(null);
      if (ok) {
        soundManager.playSelect();
        setFeedback('Consumabile applicato!');
      }
      return;
    }

    soundManager.playSelect();
    gm.toggleSelectDie(dieId);
  };

  const handleConfirmAndRoll = () => {
    if (!gm.canConfirmAndRoll) return;
    setTargetingSlot(null);
    if (gm.confirmSelectionAndRoll()) {
      triggerRollAnim();
      if (!gm.isAwaitingFarkleResolution) {
        setFeedback('Seleziona i dadi per fare punti');
      }
    }
  };

  const handleBank = () => {
    if (!gm.canBank) return;
    setTargetingSlot(null);
    soundManager.playSelect();
    if (gm.bankPotAndEndTurn()) {
      triggerRollAnim();
      setFeedback('Punti versati in Banca!');
    }
  };

  const handleConsumableClick = (slotIndex: number) => {
    soundManager.unlock();
    if (targetingSlot === slotIndex) {
      setTargetingSlot(null);
      return;
    }
    if (!gm.canUseConsumable(slotIndex)) return;

    const type = gm.equippedConsumables[slotIndex];
    const meta = CONSUMABLE_METADATA[type];
    if (meta.requiresDieTarget) {
      setTargetingSlot(slotIndex);
      setFeedback(`Tocca un dado per usare ${meta.displayName}`);
    } else if (gm.useImmediateConsumable(slotIndex)) {
      soundManager.playSelect();
      setFeedback(`${meta.displayName} attivato!`);
    }
  };

  const handleRestart = () => {
    setTargetingSlot(null);
    setShopFeedback('');
    gm.startNewRun();
    triggerRollAnim();
    setFeedback('Nuova Run iniziata! Buona fortuna!');
  };

  const bossMeta = BOSS_METADATA[gm.anteBoss];
  const isBossActiveNow = gm.currentStage === GameConfig.BossStageNumber;
  const bankPercent = Math.min(100, Math.round((gm.bankScore / gm.currentStageTarget) * 100));
  const willTriggerHotDice =
    gm.canConfirmAndRoll &&
    gm.dice.length > 0 &&
    gm.dice.every(
      (d) =>
        d.state === DieState.Selected ||
        d.state === DieState.Locked ||
        d.state === DieState.Frozen
    );

  return (
    <div className="app-shell">
      <SwirlBackground />

      {screen === 'home' ? (
        <HomeScreen
          muted={muted}
          onStartGame={handleStartFromHome}
          onOpenRules={() => setShowRules(true)}
          onToggleMute={() => setMuted(soundManager.toggleMute())}
        />
      ) : (
        <div className="game-layout">
          {/* TOP HUD */}
          <header className="hud-header">
            <div className="hud-top-row">
              <div className="hud-badges">
                <span className="pill pill-stage">
                  S{gm.currentStage}/{GameConfig.TotalStages}
                </span>
                <span className="pill pill-turn">
                  T{gm.currentTurn}/{gm.maxTurns}
                </span>
                <span className="pill pill-shields" title="Scudi anti-Farkle">
                  <GameIcons.Shield size={17} /> {gm.remainingShields}
                </span>
                <span className="pill pill-coins" title="Monete">
                  <GameIcons.Coins size={17} /> {gm.coins}
                </span>
              </div>

              <div className="hud-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setMuted(soundManager.toggleMute())}
                  aria-label={muted ? 'Attiva audio' : 'Disattiva audio'}
                >
                  {muted ? <GameIcons.SoundOff size={17} /> : <GameIcons.SoundOn size={17} />}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowRules(true)}
                  aria-label="Regole"
                >
                  <GameIcons.Rules size={17} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setScreen('home')}
                  aria-label="Torna alla Home"
                >
                  <GameIcons.Home size={17} />
                </button>
              </div>
            </div>

            {/* BANK PROGRESS & BOSS STRIP (impilati per mobile verticale) */}
            <div className="bank-box">
              <div className="bank-labels">
                <span className="muted-label">BANCA STAGE {gm.currentStage}</span>
                <span className="bank-numbers">
                  {gm.bankScore} / {gm.currentStageTarget}
                </span>
              </div>
              <div className="bank-bar-track">
                <div className="bank-bar-fill" style={{ width: `${bankPercent}%` }} />
              </div>
            </div>

            {isBossActiveNow && (
              <div
                className="boss-mini-card boss-active"
                style={{ borderColor: bossMeta.themeColorHex }}
              >
                <div className="boss-mini-title" style={{ color: bossMeta.themeColorHex }}>
                  <BossIcon boss={gm.anteBoss} size={14} />
                  <span>BOSS: {bossMeta.displayName}</span>
                </div>
                <span className="boss-mini-desc">{bossMeta.shortDescription}</span>
              </div>
            )}
          </header>

          {/* CENTER TABLE (stile tavolo originale Unity) */}
          <main className="table-area">
            {/* NEL PIATTO: 6 slot fissi (dadi bloccati/congelati + slot vuoti) */}
            <div className="nel-piatto-rack">
              <span className="rack-label">NEL PIATTO:</span>
              <div className="nel-piatto-slots">
                {Array.from({ length: GameConfig.DefaultDiceCount }, (_, idx) => {
                  const lockedDie = lockedAndFrozenDice[idx];
                  if (lockedDie) {
                    return <DieView key={lockedDie.id} die={lockedDie} compact disabled />;
                  }
                  return <div key={`empty-${idx}`} className="nel-piatto-empty-slot" />;
                })}
              </div>
            </div>

            {/* PIATTO & MOLTIPLICATORE */}
            <div className="pot-row">
              <div className="pot-main">
                <span className="pot-caption">PIATTO:</span>
                <span className="pot-value">{gm.currentPot}</span>
                {gm.previewSelectionScore > 0 && (
                  <span className="pot-delta">+{gm.previewSelectionScore}</span>
                )}
                {gm.previewSelectionCoins > 0 && (
                  <span className="pot-coins-delta">
                    +{gm.previewSelectionCoins} <GameIcons.Coins size={14} />
                  </span>
                )}
              </div>

              <div className="pot-meta">
                {gm.hasCloverProtection && (
                  <span className="clover-badge" title="Protezione Trifoglio attiva">
                    <GameIcons.Clover size={15} /> SALVO
                  </span>
                )}
                <span className={`mult-badge ${gm.multiplier > 1 ? 'mult-hot' : ''}`}>
                  x{gm.multiplier}
                </span>
              </div>
            </div>

            {/* FEEDBACK FLOATING */}
            <div className={`feedback-text ${gm.isAwaitingFarkleResolution ? 'is-farkle' : ''}`}>
              {targetingSlot !== null ? (
                <div className="targeting-banner">
                  <span>{feedback}</span>
                  <button
                    type="button"
                    className="btn-cancel-target"
                    onClick={() => {
                      setTargetingSlot(null);
                      setFeedback('Selezione annullata');
                    }}
                  >
                    ANNULLA
                  </button>
                </div>
              ) : (
                <span>
                  {gm.previewSelectionDescription
                    ? `${gm.previewSelectionDescription} (+${gm.previewSelectionScore} pt)`
                    : feedback}
                </span>
              )}
            </div>

            {/* ACTIVE DICE POOL (3x2 mobile-first, tint rosso su Farkle) */}
            <div className={`dice-pool-grid ${gm.isAwaitingFarkleResolution ? 'is-farkle-dice' : ''}`}>
              {activeDice.map((die) => (
                <DieView
                  key={die.id}
                  die={die}
                  rolling={isRollingAnim}
                  isTargeting={targetingSlot !== null}
                  isValidTarget={
                    targetingSlot !== null &&
                    gm.canTargetDieWithConsumable(gm.equippedConsumables[targetingSlot], die)
                  }
                  disabled={gm.isAwaitingFarkleResolution}
                  onClick={handleDieClick}
                />
              ))}
            </div>
          </main>

          {/* CONSUMABLES BELT (solo se possiedi consumabili) + BOTTOM ACTIONS */}
          <footer className="bottom-dock">
            {gm.equippedConsumables.length > 0 && (
              <div className="consumable-belt">
                {gm.equippedConsumables.map((item, idx) => {
                  const meta = CONSUMABLE_METADATA[item];
                  const usable = gm.canUseConsumable(idx);
                  const isSelectedTarget = targetingSlot === idx;
                  return (
                    <button
                      key={`${item}-${idx}`}
                      type="button"
                      className={`belt-slot belt-filled ${isSelectedTarget ? 'belt-targeting' : ''}`}
                      disabled={!usable && !isSelectedTarget}
                      onClick={() => handleConsumableClick(idx)}
                    >
                      <ConsumableIcon type={item} size={22} className="belt-icon" />
                      <div className="belt-text">
                        <strong>{meta.displayName}</strong>
                        <small>{meta.shortDescription}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="action-buttons">
              <button
                type="button"
                className={`btn ${willTriggerHotDice ? 'btn-hot-dice' : 'btn-gold'} btn-action`}
                disabled={!gm.canConfirmAndRoll}
                onClick={handleConfirmAndRoll}
              >
                {willTriggerHotDice ? 'HOT DICE!' : 'TIENI & TIRA'}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-action"
                disabled={!gm.canBank}
                onClick={handleBank}
              >
                INCASSA ({gm.totalBankablePot})
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* OVERLAYS */}
        { screen === 'game' && gm.isInShop && showStageClear && (
          <StageClearModal
            clearedStage={gm.currentStage}
            bankScore={gm.bankScore}
            stageTarget={gm.currentStageTarget}
            overkillPoints={gm.lastStageOverkillPoints}
            totalCoinsEarned={gm.lastStageCoinsEarned}
            currentCoins={gm.coins}
            anteBoss={gm.anteBoss}
            onOpenShop={() => setShowStageClear(false)}
          />
        )}

      {screen === 'game' && gm.isInShop && !showStageClear && (
        <ShopOverlay
          currentStage={gm.currentStage}
          coins={gm.coins}
          remainingShields={gm.remainingShields}
          trisBaseMultiplier={gm.trisBaseMultiplier}
          equippedConsumables={gm.equippedConsumables}
          offeredConsumable={gm.shopOfferedConsumable}
          persistentPoolTypes={gm.persistentPoolTypes}
          hasStandardDie={gm.hasStandardDieInPersistentPool()}
          feedback={shopFeedback}
          onBuyShield={() => {
            if (gm.buyRepairShield()) setShopFeedback('Scudo riparato! (+1)');
          }}
          onBuyConsumable={() => {
            const bought = gm.buyShopConsumable();
            if (bought) setShopFeedback(`Acquistato: ${CONSUMABLE_METADATA[bought].displayName}`);
          }}
          onRerollConsumable={() => {
            if (gm.rerollShopConsumable()) setShopFeedback('Offerta consumabile aggiornata!');
          }}
          onBuySpecialDie={() => {
            const newType = gm.buyRandomSpecialDie();
            if (newType) {
              const label =
                newType === DieType.Golden
                  ? 'Dado Oro'
                  : newType === DieType.Loaded
                    ? 'Dado Truccato'
                    : 'Dado Moltiplicatore x2';
              setShopFeedback(`Potenziato 1 dado in: ${label}!`);
            }
          }}
          onBuyTrisUpgrade={() => {
            if (gm.buyTrisMultiplierUpgrade()) {
              setShopFeedback(`Bonus Tris potenziato a x${gm.trisBaseMultiplier.toFixed(1)}!`);
            }
          }}
          onNextStage={() => {
            setShopFeedback('');
            gm.advanceToNextStage();
            triggerRollAnim();
            setFeedback(`Stage ${gm.currentStage} iniziato!`);
          }}
        />
      )}

      {screen === 'game' && gm.isGameOver && (
        <GameOverModal
          isVictory={gm.isVictory}
          currentStage={gm.currentStage}
          bankScore={gm.bankScore}
          stageTarget={gm.currentStageTarget}
          coins={gm.coins}
          onRestart={handleRestart}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
};

export default App;
