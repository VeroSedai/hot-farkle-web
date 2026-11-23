import React, { useEffect, useRef, useState } from 'react';
import { DieView } from './components/DieView';
import { GameOverModal } from './components/GameOverModal';
import { HomeScreen } from './components/HomeScreen';
import { BossIcon, ConsumableIcon, GameIcons } from './components/Icons';
import { RulesModal } from './components/RulesModal';
import { ShopOverlay } from './components/ShopOverlay';
import { StageClearModal } from './components/StageClearModal';
import { SwirlBackground } from './components/SwirlBackground';
import { TutorialOverlay } from './components/TutorialOverlay';
import { DieState, DieType } from './core/die';
import { FarkleGameManager } from './core/farkleGameManager';
import { ScoreEvaluator } from './core/scoreEvaluator';
import { BOSS_METADATA } from './data/bossType';
import { CONSUMABLE_METADATA } from './data/consumableType';
import { GameConfig } from './data/gameConfig';
import { useI18n } from './i18n/I18nContext';
import { soundManager } from './utils/audio';
import { loadStats, PlayerStats, recordBankedPot, recordRunEnd } from './utils/stats';

const TUTORIAL_STORAGE_KEY = 'hotfarkle_tutorial_completed';

export const App: React.FC = () => {
  const { lang, t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

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
  const [shopUnlockedForStage, setShopUnlockedForStage] = useState<number>(0);
  const [openPopover, setOpenPopover] = useState<'none' | 'quick' | 'audio'>('none');
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [bgmMuted, setBgmMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [isRollingAnim, setIsRollingAnim] = useState(false);
  const [tableEffect, setTableEffect] = useState<'none' | 'farkle' | 'hotdice'>('none');
  const tableEffectTimerRef = useRef<number | null>(null);
  const [stats, setStats] = useState<PlayerStats>(() => loadStats());
  const [tableToast, setTableToast] = useState<string>('');
  const tableToastTimerRef = useRef<number | null>(null);
  const [targetPrompt, setTargetPrompt] = useState<string>('');
  const [shopFeedback, setShopFeedback] = useState<string>('');

  const forceUpdate = () => setTick((t) => t + 1);

  const showTableToast = (msg: string, durationMs = 1700) => {
    if (tableToastTimerRef.current !== null) {
      window.clearTimeout(tableToastTimerRef.current);
    }
    setTableToast(msg);
    tableToastTimerRef.current = window.setTimeout(() => {
      setTableToast('');
      tableToastTimerRef.current = null;
    }, durationMs);
  };

  const triggerRollAnim = () => {
    soundManager.playRoll();
    setIsRollingAnim(true);
    window.setTimeout(() => setIsRollingAnim(false), 480);
  };

  const triggerTableEffect = (kind: 'farkle' | 'hotdice', durationMs: number) => {
    if (tableEffectTimerRef.current !== null) {
      window.clearTimeout(tableEffectTimerRef.current);
    }
    setTableEffect(kind);
    tableEffectTimerRef.current = window.setTimeout(() => {
      setTableEffect('none');
      tableEffectTimerRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    soundManager.unlock();
    const unlockOnGesture = () => {
      soundManager.unlock();
    };
    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture, { passive: true });

    const unsubState = gm.on('stateChanged', forceUpdate);
    const unsubHotDice = gm.on('hotDice', () => {
      triggerTableEffect('hotdice', 700);
    });
    const unsubGrace = gm.on('graceRoll', () => {
      showTableToast(tRef.current('feedback.graceRoll'), 2000);
    });
    const unsubGameOver = gm.on('gameOver', () => {
      setStats(recordRunEnd(gm.isVictory, gm.bankScore));
    });
    const unsubFarkle = gm.on('farkle', () => {
      triggerTableEffect('farkle', 550);
      if (gm.lastFarkleUsedClover) {
        showTableToast(tRef.current('feedback.farkleClover'), 1800);
      } else if (gm.lastFarkleConsumedShield) {
        showTableToast(tRef.current('feedback.farkleShield'), 1800);
      }
      window.setTimeout(() => {
        gm.completePendingFarkleTurn();
        if (!gm.isGameOver && !gm.isInShop) {
          triggerRollAnim();
        }
      }, 1150);
    });

    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
      unsubState();
      unsubHotDice();
      unsubGrace();
      unsubGameOver();
      unsubFarkle();
    };
  }, [gm]);

  const lockedAndFrozenDice = gm.dice.filter(
    (d) => d.state === DieState.Locked || d.state === DieState.Frozen
  );

  const activeDice = gm.dice.filter(
    (d) => d.state === DieState.InPool || d.state === DieState.Selected
  );

  const completeTutorial = () => {
    setTutorialStep(0);
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  };

  const handleNextTutorialStep = () => {
    soundManager.playSelect();
    if (tutorialStep >= 4) {
      completeTutorial();
    } else {
      setTutorialStep((s) => s + 1);
    }
  };

  const handleStartFromHome = () => {
    soundManager.unlock();
    setTargetingSlot(null);
    setTargetPrompt('');
    setTableToast('');
    setShopFeedback('');
    setShopUnlockedForStage(0);
    setOpenPopover('none');
    gm.startNewRun();
    setScreen('game');
    triggerRollAnim();

    try {
      if (!localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
        setTutorialStep(1);
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleDieClick = (dieId: number) => {
    soundManager.unlock();
    setOpenPopover('none');
    if (targetingSlot !== null) {
      const usedType = gm.equippedConsumables[targetingSlot];
      const ok = gm.useTargetedConsumable(targetingSlot, dieId);
      setTargetingSlot(null);
      setTargetPrompt('');
      if (ok) {
        if (usedType === 'GettoneSpinta') {
          soundManager.playRoll(true);
        } else {
          soundManager.playSelect(true, 2);
        }
        showTableToast(t('feedback.consumableApplied'), 1400);
      }
      return;
    }

    gm.toggleSelectDie(dieId);
    const clickedDie = gm.dice.find((d) => d.id === dieId);
    const isNowSelected = clickedDie?.state === DieState.Selected;
    const currentSelectedCount = gm.dice.filter((d) => d.state === DieState.Selected).length;
    soundManager.playSelect(isNowSelected, currentSelectedCount);

    if (tutorialStep === 2 && gm.isSelectionValid && gm.previewSelectionScore > 0) {
      setTutorialStep(3);
    }
  };

  const handleConfirmAndRoll = () => {
    if (!gm.canConfirmAndRoll) return;
    setTargetingSlot(null);
    setTargetPrompt('');
    if (gm.confirmSelectionAndRoll()) {
      triggerRollAnim();
    }
  };

  const handleBank = () => {
    if (!gm.canBank) return;
    setTargetingSlot(null);
    setTargetPrompt('');
    const potToBank = gm.totalBankablePot;
    if (gm.bankPotAndEndTurn()) {
      setStats(recordBankedPot(potToBank, gm.bankScore));
      if (!gm.isGameOver && !gm.isInShop) {
        triggerRollAnim();
      } else {
        soundManager.playSelect(true, 3);
      }
    }
  };

  const handleConsumableClick = (slotIndex: number) => {
    soundManager.unlock();
    if (targetingSlot === slotIndex) {
      setTargetingSlot(null);
      setTargetPrompt('');
      return;
    }
    if (!gm.canUseConsumable(slotIndex)) return;

    const type = gm.equippedConsumables[slotIndex];
    const meta = CONSUMABLE_METADATA[type];
    const consumableName = t(`consumables.${type}.name`);
    if (meta.requiresDieTarget) {
      setTargetingSlot(slotIndex);
      setTargetPrompt(t('feedback.targetPrompt', { name: consumableName }));
    } else if (gm.useImmediateConsumable(slotIndex)) {
      soundManager.playSelect();
      showTableToast(t('feedback.consumableActivated', { name: consumableName }), 1500);
    }
  };

  const handleRestart = () => {
    setTargetingSlot(null);
    setTargetPrompt('');
    setTableToast('');
    setShopFeedback('');
    setShopUnlockedForStage(0);
    gm.startNewRun();
    triggerRollAnim();
  };

  const bossMeta = BOSS_METADATA[gm.anteBoss];
  const isBossActiveNow = gm.currentBoss !== 'None';
  const bankPercent = Math.min(100, Math.round((gm.bankScore / gm.currentStageTarget) * 100));
  const previewBankScore = gm.bankScore + gm.totalBankablePot;
  const bankPreviewPercent = Math.min(100, Math.round((previewBankScore / gm.currentStageTarget) * 100));
  const willClearStageOnBank = gm.totalBankablePot > 0 && previewBankScore >= gm.currentStageTarget;
  const swirlHeat =
    screen === 'game'
      ? Math.min(1, (gm.multiplier - 1) * 0.35 + (tableEffect === 'hotdice' ? 0.65 : 0))
      : 0;
  const selectedDice = gm.dice.filter((d) => d.state === DieState.Selected);
  const selectionDescription = ScoreEvaluator.describeSelection(
    selectedDice,
    gm.hotDiceLevel,
    gm.currentBoss,
    lang
  );
  const isSpecialCombo =
    Boolean(selectionDescription) && !/^[15](\s*\+\s*[15])*$/.test(selectionDescription);
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
      <SwirlBackground
        heat={swirlHeat}
        accentHex={screen === 'game' && isBossActiveNow ? bossMeta.themeColorHex : undefined}
      />

      {screen === 'home' ? (
        <HomeScreen
          muted={bgmMuted && sfxMuted}
          stats={stats}
          onStartGame={handleStartFromHome}
          onOpenRules={() => setShowRules(true)}
          onToggleMute={() => {
            const allMuted = soundManager.toggleMute();
            setBgmMuted(allMuted);
            setSfxMuted(allMuted);
          }}
        />
      ) : (
        <div className="game-layout">
          {/* LEFT SIDEBAR ON DESKTOP (display: contents on mobile) */}
          <aside className="game-sidebar">
            {/* TOP HUD */}
            <header className="hud-header">
              <div className="hud-top-row">
                <div className="hud-badges">
                  <span className="pill pill-stage">
                    S{gm.currentStage}
                    {gm.isEndlessMode ? ' ∞' : `/${GameConfig.TotalStages}`}
                  </span>
                  <span className="pill pill-turn">
                    T{gm.currentTurn}/{gm.maxTurns}
                  </span>
                  <span className="pill pill-shields" title={t('hud.shieldsTitle')}>
                    <GameIcons.Shield size={17} /> {gm.remainingShields}/{GameConfig.MaxShields}
                  </span>
                  <span className="pill pill-coins" title={t('hud.coinsTitle')}>
                    <GameIcons.Coins size={17} /> {gm.coins}
                  </span>
                </div>

                <div className="hud-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setOpenPopover((p) => (p === 'audio' ? 'none' : 'audio'))}
                    aria-label={t('hud.audioOptions')}
                  >
                    {bgmMuted && sfxMuted ? (
                      <GameIcons.SoundOff size={17} />
                    ) : (
                      <GameIcons.SoundOn size={17} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      setOpenPopover('none');
                      setShowRules(true);
                    }}
                    aria-label={t('hud.rules')}
                  >
                    <GameIcons.Rules size={17} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setOpenPopover((p) => (p === 'quick' ? 'none' : 'quick'))}
                    aria-label={t('hud.menuOptions')}
                  >
                    <GameIcons.Menu size={17} />
                  </button>
                </div>
              </div>

              {openPopover !== 'none' && (
                <>
                  <div className="popover-backdrop" onClick={() => setOpenPopover('none')} />
                  {openPopover === 'audio' && (
                    <div className="popover-panel">
                      <button
                        type="button"
                        className={`btn ${!bgmMuted ? 'btn-primary' : 'btn-ghost'} popover-btn`}
                        onClick={() => setBgmMuted(soundManager.toggleBgm())}
                      >
                        {t('hud.music')}: {!bgmMuted ? t('hud.on') : t('hud.off')}
                      </button>
                      <button
                        type="button"
                        className={`btn ${!sfxMuted ? 'btn-primary' : 'btn-ghost'} popover-btn`}
                        onClick={() => setSfxMuted(soundManager.toggleSfx())}
                      >
                        {t('hud.effects')}: {!sfxMuted ? t('hud.on') : t('hud.off')}
                      </button>
                    </div>
                  )}

                  {openPopover === 'quick' && (
                    <div className="popover-panel">
                      <button
                        type="button"
                        className="btn btn-gold popover-btn"
                        onClick={() => {
                          setOpenPopover('none');
                          handleRestart();
                        }}
                      >
                        {t('hud.newGame')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary popover-btn"
                        onClick={() => {
                          setOpenPopover('none');
                          setTutorialStep(1);
                        }}
                      >
                        {t('hud.reviewTutorial')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost popover-btn"
                        onClick={() => {
                          setOpenPopover('none');
                          setScreen('home');
                        }}
                      >
                        {t('hud.backHome')}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* BANK PROGRESS & BOSS STRIP */}
              <div className="desktop-stat-grid">
                <div className="stat-tile stat-tile-stage">
                  <span className="stat-tile-label">STAGE</span>
                  <strong className="stat-tile-val">
                    {gm.currentStage} / {gm.isEndlessMode ? '∞' : GameConfig.TotalStages}
                  </strong>
                </div>
                <div className="stat-tile stat-tile-turn">
                  <span className="stat-tile-label">{lang === 'it' ? 'TURNO' : 'TURN'}</span>
                  <strong className="stat-tile-val">
                    {gm.currentTurn} / {gm.maxTurns}
                  </strong>
                </div>
                <div className="stat-tile stat-tile-shields" title={t('hud.shieldsTitle')}>
                  <span className="stat-tile-label">{lang === 'it' ? 'SCUDI' : 'SHIELDS'}</span>
                  <strong className="stat-tile-val">
                    <GameIcons.Shield size={18} /> {gm.remainingShields} / {GameConfig.MaxShields}
                  </strong>
                </div>
                <div className="stat-tile stat-tile-coins" title={t('hud.coinsTitle')}>
                  <span className="stat-tile-label">{lang === 'it' ? 'MONETE' : 'COINS'}</span>
                  <strong className="stat-tile-val">
                    <GameIcons.Coins size={18} /> {gm.coins}
                  </strong>
                </div>
              </div>

              <div className="bank-box">
                <div className="bank-labels">
                  <span className="muted-label">{t('hud.bankStage', { stage: gm.currentStage })}</span>
                  <span className="bank-numbers">
                    {gm.bankScore} / {gm.currentStageTarget}
                  </span>
                </div>
                <div className="bank-bar-track">
                  {gm.totalBankablePot > 0 && (
                    <div
                      className={`bank-bar-preview ${willClearStageOnBank ? 'bank-bar-preview-clear' : ''}`}
                      style={{ width: `${bankPreviewPercent}%` }}
                    />
                  )}
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
                    <span>{t('hud.bossPrefix', { name: t(`bosses.${gm.anteBoss}.name`) })}</span>
                  </div>
                  <span className="boss-mini-desc">{t(`bosses.${gm.anteBoss}.desc`)}</span>
                </div>
              )}
            </header>

            {/* DESKTOP SIDEBAR: CONSUMABLES */}
            <div className="desktop-sidebar-panels">
              <section className="sidebar-card sidebar-items-card">
                <div className="sidebar-card-header">
                  <span>
                    {lang === 'it' ? 'OGGETTI' : 'ITEMS'} ({gm.equippedConsumables.length}/
                    {GameConfig.MaxConsumableSlots})
                  </span>
                </div>
                <div className="sidebar-items-list">
                  {Array.from({ length: GameConfig.MaxConsumableSlots }, (_, idx) => {
                    const item = gm.equippedConsumables[idx];
                    if (!item) {
                      return (
                        <div key={`sidebar-empty-${idx}`} className="belt-slot belt-empty">
                          <span>{lang === 'it' ? 'Slot vuoto' : 'Empty slot'}</span>
                        </div>
                      );
                    }
                    const usable = gm.canUseConsumable(idx);
                    const isSelectedTarget = targetingSlot === idx;
                    return (
                      <button
                        key={`sidebar-${item}-${idx}`}
                        type="button"
                        className={`belt-slot belt-filled ${isSelectedTarget ? 'belt-targeting' : ''}`}
                        disabled={!usable && !isSelectedTarget}
                        onClick={() => handleConsumableClick(idx)}
                      >
                        <ConsumableIcon type={item} size={24} className="belt-icon" />
                        <div className="belt-text">
                          <strong>{t(`consumables.${item}.name`)}</strong>
                          <small>{t(`consumables.${item}.desc`)}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </aside>

          {/* RIGHT COLUMN ON DESKTOP (display: contents on mobile) */}
          <div className="game-board-col">
            {/* CENTER TABLE */}
            <main
              className={`table-area ${
                tableEffect === 'farkle'
                  ? 'table-fx-farkle'
                  : tableEffect === 'hotdice'
                    ? 'table-fx-hotdice'
                    : ''
              }`}
            >
              {/* VASSOIO DEL PIATTO: Punteggio + Moltiplicatore + 6 alloggiamenti dadi bloccati */}
              <div className="pot-tray">
                <div className="pot-row">
                  <div className="pot-main">
                    <span className="pot-caption">{t('table.potCaption')}</span>
                    <span className={`pot-value ${gm.currentPot > 0 ? 'pot-value-active' : ''}`}>
                      {gm.currentPot}
                    </span>
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
                      <span className="clover-badge" title={t('table.cloverTitle')}>
                        <GameIcons.Clover size={15} /> {t('table.cloverBadge')}
                      </span>
                    )}
                    <span className={`mult-badge ${gm.multiplier > 1 ? 'mult-hot' : ''}`}>
                      x{gm.multiplier}
                    </span>
                  </div>
                </div>

                <div className="nel-piatto-well" aria-label={t('table.inPotRack')}>
                  <span className="nel-piatto-label">
                    {t('table.inPotRack').replace(/:$/, '')}
                  </span>
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
              </div>

              {/* CENTER STAGE: callout contestuale (solo targeting / combo / eventi) + DICE POOL */}
              <div className="table-stage">
                <div className="table-callout-slot">
                  {targetingSlot !== null ? (
                    <div className="targeting-banner">
                      <span>{targetPrompt}</span>
                      <button
                        type="button"
                        className="btn-cancel-target"
                        onClick={() => {
                          setTargetingSlot(null);
                          setTargetPrompt('');
                        }}
                      >
                        {t('table.cancel')}
                      </button>
                    </div>
                  ) : isSpecialCombo ? (
                    <span className="combo-callout-pill">{selectionDescription}</span>
                  ) : tableToast ? (
                    <span className="event-toast-pill">{tableToast}</span>
                  ) : null}
                </div>

                {/* ACTIVE DICE POOL (3x2 mobile-first, 6x1 desktop) */}
                <div
                  className={`dice-pool-grid ${gm.isAwaitingFarkleResolution ? 'is-farkle-dice' : ''} ${
                    tutorialStep === 2 ? 'tutorial-highlight-dice' : ''
                  }`}
                >
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
              </div>

              {tableEffect !== 'none' && (
                <div
                  className={`table-stamp ${
                    tableEffect === 'farkle' ? 'table-stamp-farkle' : 'table-stamp-hotdice'
                  }`}
                  aria-hidden="true"
                >
                  {tableEffect === 'farkle' ? 'FARKLE!' : `HOT DICE! x${gm.multiplier}`}
                </div>
              )}
            </main>

            {/* CONSUMABLES BELT (mobile only) + BOTTOM ACTIONS */}
            <footer className="bottom-dock">
              {gm.equippedConsumables.length > 0 && (
                <div className="consumable-belt mobile-only-belt">
                  {gm.equippedConsumables.map((item, idx) => {
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
                          <strong>{t(`consumables.${item}.name`)}</strong>
                          <small>{t(`consumables.${item}.desc`)}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="action-buttons">
                <button
                  type="button"
                  className={`btn ${willTriggerHotDice ? 'btn-hot-dice' : 'btn-orange'} btn-action`}
                  disabled={!gm.canConfirmAndRoll}
                  onClick={handleConfirmAndRoll}
                >
                  {willTriggerHotDice ? t('table.hotDiceBtn') : t('table.keepAndRollBtn')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-action"
                  disabled={!gm.canBank}
                  onClick={handleBank}
                >
                  {t('table.bankBtn', { amount: gm.totalBankablePot })}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* OVERLAYS */}
      {screen === 'game' && gm.isInShop && shopUnlockedForStage !== gm.currentStage && (
        <StageClearModal
          clearedStage={gm.currentStage}
          bankScore={gm.bankScore}
          stageTarget={gm.currentStageTarget}
          overkillPoints={gm.lastStageOverkillPoints}
          totalCoinsEarned={gm.lastStageCoinsEarned}
          currentCoins={gm.coins}
          anteBoss={gm.anteBoss}
          onOpenShop={() => setShopUnlockedForStage(gm.currentStage)}
        />
      )}

      {screen === 'game' && gm.isInShop && shopUnlockedForStage === gm.currentStage && (
        <ShopOverlay
          currentStage={gm.currentStage}
          coins={gm.coins}
          remainingShields={gm.remainingShields}
          trisBaseMultiplier={gm.trisBaseMultiplier}
          trisUpgradeCost={gm.trisUpgradeCost}
          equippedConsumables={gm.equippedConsumables}
          offeredConsumable={gm.shopOfferedConsumable}
          persistentPoolTypes={gm.persistentPoolTypes}
          hasStandardDie={gm.hasStandardDieInPersistentPool()}
          feedback={shopFeedback}
          onBuyShield={() => {
            if (gm.buyRepairShield()) setShopFeedback(t('shopFeedback.shieldRepaired'));
          }}
          onBuyConsumable={() => {
            const bought = gm.buyShopConsumable();
            if (bought) {
              setShopFeedback(
                t('shopFeedback.boughtConsumable', { name: t(`consumables.${bought}.name`) })
              );
            }
          }}
          onSellConsumable={(slotIndex) => {
            const sold = gm.sellShopConsumable(slotIndex);
            if (sold) {
              soundManager.playSelect();
              setShopFeedback(
                t('shopFeedback.soldConsumable', {
                  name: t(`consumables.${sold}.name`),
                  coins: GameConfig.ShopConsumableSellValue,
                })
              );
            }
          }}
          onRerollConsumable={() => {
            if (gm.rerollShopConsumable()) setShopFeedback(t('shopFeedback.rerolled'));
          }}
          onBuySpecialDie={() => {
            const newType = gm.buyRandomSpecialDie();
            if (newType) {
              const label =
                newType === DieType.Golden
                  ? t('shopFeedback.dieGolden')
                  : newType === DieType.Loaded
                    ? t('shopFeedback.dieLoaded')
                    : t('shopFeedback.dieMultiplier');
              setShopFeedback(t('shopFeedback.upgradedDie', { label }));
            }
          }}
          onBuyTrisUpgrade={() => {
            if (gm.buyTrisMultiplierUpgrade()) {
              setShopFeedback(
                t('shopFeedback.trisUpgraded', { mult: gm.trisBaseMultiplier.toFixed(1) })
              );
            }
          }}
          onNextStage={() => {
            setShopFeedback('');
            gm.advanceToNextStage();
            triggerRollAnim();
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
          stats={stats}
          onContinueEndless={
            gm.isVictory
              ? () => {
                  if (gm.enterEndlessMode()) {
                    setShopUnlockedForStage(gm.currentStage);
                  }
                }
              : undefined
          }
          onRestart={handleRestart}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {screen === 'game' && tutorialStep >= 1 && tutorialStep <= 4 && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={handleNextTutorialStep}
          onSkip={completeTutorial}
        />
      )}
    </div>
  );
};

export default App;
