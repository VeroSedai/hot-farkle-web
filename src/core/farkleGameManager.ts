import { BossType } from '../data/bossType';
import { CONSUMABLE_METADATA, ConsumableType } from '../data/consumableType';
import { GameConfig, getStageTarget, isBossStage } from '../data/gameConfig';
import { Die, DieState, DieType, RngFn } from './die';
import { ScoreEvaluator } from './scoreEvaluator';

const SPECIAL_DIE_CANDIDATES: readonly DieType[] = [
  DieType.Golden,
  DieType.Loaded,
  DieType.Multiplier,
];

const ALL_CONSUMABLE_TYPES: readonly ConsumableType[] = [
  ConsumableType.GettoneSpinta,
  ConsumableType.GhiaccioSecco,
  ConsumableType.Polizza,
  ConsumableType.DadoJolly,
  ConsumableType.Trifoglio,
];

const BOSS_CANDIDATES: readonly BossType[] = [
  BossType.GeloPerenne,
  BossType.Fornace,
  BossType.Esattore,
];

export type GameEventType = 'stateChanged' | 'farkle' | 'graceRoll' | 'hotDice' | 'shopOpened' | 'gameOver';

export class FarkleGameManager {
  private readonly _rng: RngFn;
  private readonly _dice: Die[] = [];
  private readonly _persistentPoolTypes: DieType[] = new Array(GameConfig.DefaultDiceCount).fill(DieType.Standard);
  private _isFirstRollOfTurn = false;

  public currentStage = 1;
  public anteBoss: BossType = BossType.GeloPerenne;
  public coins: number = GameConfig.StartingCoins;
  public trisBaseMultiplier = 1.0;
  public trisUpgradesBought = 0;
  public lastStageCoinsEarned = 0;
  public lastStageOverkillPoints = 0;
  public isInShop = false;

  public equippedConsumables: ConsumableType[] = [];
  public shopOfferedConsumable: ConsumableType = ConsumableType.GettoneSpinta;

  public bankScore = 0;
  public currentPot = 0;
  public currentTurn = 1;
  public remainingShields: number = GameConfig.StartingShields;
  public hotDiceLevel = 0;
  public mustRollAfterHotDice = false;
  public actionUsedThisRoll = false;
  public hasCloverProtection = false;
  public lastSpintaEarnedBonus = false;

  public previewSelectionScore = 0;
  public previewSelectionCoins = 0;
  public previewSelectionDescription = '';
  public isSelectionValid = false;
  public isGameOver = false;
  public isVictory = false;
  public isEndlessMode = false;
  public lastFarkleConsumedShield = false;
  public lastFarkleUsedClover = false;
  public deferFarkleTurnAdvance = false;
  public isAwaitingFarkleResolution = false;

  private readonly _listeners: Record<GameEventType, Set<() => void>> = {
    stateChanged: new Set(),
    farkle: new Set(),
    graceRoll: new Set(),
    hotDice: new Set(),
    shopOpened: new Set(),
    gameOver: new Set(),
  };

  constructor(rng: RngFn = Math.random) {
    this._rng = rng;
    this.resetPersistentRunState();
    this.resetDicePool(GameConfig.DefaultDiceCount);
  }

  public on(event: GameEventType, cb: () => void): () => void {
    this._listeners[event].add(cb);
    return () => {
      this._listeners[event].delete(cb);
    };
  }

  private emit(event: GameEventType): void {
    for (const cb of this._listeners[event]) {
      cb();
    }
  }

  public get currentBoss(): BossType {
    return isBossStage(this.currentStage) ? this.anteBoss : BossType.None;
  }

  public get currentStageTarget(): number {
    return getStageTarget(this.currentStage);
  }

  public get maxTurns(): number {
    return this.currentBoss === BossType.Fornace ? GameConfig.FornaceMaxTurns : GameConfig.MaxTurns;
  }

  public get multiplier(): number {
    return Math.min(GameConfig.MaxMultiplier, 1 + this.hotDiceLevel);
  }

  public get isPendingFarkleSaved(): boolean {
    return this.isAwaitingFarkleResolution && (this.lastFarkleUsedClover || this.lastFarkleConsumedShield);
  }

  public get canConfirmAndRoll(): boolean {
    return (
      !this.isGameOver &&
      !this.isInShop &&
      !this.isAwaitingFarkleResolution &&
      this.isSelectionValid &&
      (this.previewSelectionScore > 0 || this.previewSelectionCoins > 0)
    );
  }

  public get canBank(): boolean {
    if (this.isGameOver || this.isInShop || this.isAwaitingFarkleResolution || this.mustRollAfterHotDice) {
      return false;
    }

    const selectedCount = this.getDiceByState(DieState.Selected).length;
    if (selectedCount > 0) {
      return this.isSelectionValid && (this.previewSelectionScore > 0 || this.previewSelectionCoins > 0);
    }

    return this.currentPot > 0;
  }

  public get totalBankablePot(): number {
    return this.currentPot + (this.isSelectionValid ? this.previewSelectionScore : 0);
  }

  public get dice(): readonly Die[] {
    return this._dice;
  }

  public get persistentPoolTypes(): readonly DieType[] {
    return this._persistentPoolTypes;
  }

  public startNewRun(): void {
    this.resetPersistentRunState();
    this.startStageInternal();
  }

  public startNewStage(): void {
    if (
      this.isGameOver ||
      this.currentStage < 1 ||
      (!this.isEndlessMode && this.currentStage > GameConfig.TotalStages)
    ) {
      this.resetPersistentRunState();
    }
    this.startStageInternal();
  }

  private resetPersistentRunState(): void {
    this.currentStage = 1;
    this.anteBoss = BOSS_CANDIDATES[Math.floor(this._rng() * BOSS_CANDIDATES.length)];
    this.coins = GameConfig.StartingCoins;
    this.remainingShields = GameConfig.StartingShields;
    this.trisBaseMultiplier = 1.0;
    this.trisUpgradesBought = 0;
    this.lastStageCoinsEarned = 0;
    this.lastStageOverkillPoints = 0;
    this.isInShop = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isEndlessMode = false;
    this.hasCloverProtection = false;

    for (let i = 0; i < this._persistentPoolTypes.length; i++) {
      this._persistentPoolTypes[i] = DieType.Standard;
    }

    this.equippedConsumables = [];
    this.shopOfferedConsumable = this.rollRandomConsumable();
  }

  private rollRandomConsumable(): ConsumableType {
    return ALL_CONSUMABLE_TYPES[Math.floor(this._rng() * ALL_CONSUMABLE_TYPES.length)];
  }

  private startStageInternal(): void {
    this.bankScore = 0;
    this.currentPot = 0;
    this.currentTurn = 1;
    this.hotDiceLevel = 0;
    this.mustRollAfterHotDice = false;
    this.actionUsedThisRoll = false;
    this.hasCloverProtection = false;
    this.lastSpintaEarnedBonus = false;
    this.previewSelectionScore = 0;
    this.previewSelectionCoins = 0;
    this.previewSelectionDescription = '';
    this.isSelectionValid = false;
    this.isInShop = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isAwaitingFarkleResolution = false;
    this._isFirstRollOfTurn = true;

    this.resetDicePool(GameConfig.DefaultDiceCount);
    this.applyBossTurnStartEffects();
    this.rollAvailableDice();
  }

  public rollAvailableDice(): void {
    if (this.isGameOver || this.isInShop) return;

    for (const die of this._dice) {
      if (die.state === DieState.Selected) {
        die.state = DieState.InPool;
      }
    }

    const inPoolDice = this.getDiceByState(DieState.InPool);
    if (inPoolDice.length === 0) return;

    const expectedStartingInPool = Math.max(
      1,
      GameConfig.DefaultDiceCount -
        (this.currentBoss === BossType.GeloPerenne ? GameConfig.GeloPerenneStartingFrozenDice : 0)
    );
    const isGraceRollEligible =
      this._isFirstRollOfTurn &&
      this._dice.length === GameConfig.DefaultDiceCount &&
      inPoolDice.length >= expectedStartingInPool;

    this.rollDiceList(inPoolDice);

    if (isGraceRollEligible && !this.hasScoringCombinationInPool()) {
      while (!this.hasScoringCombinationInPool()) {
        this.rollDiceList(inPoolDice);
      }
      this.emit('graceRoll');
    }

    this._isFirstRollOfTurn = false;
    this.actionUsedThisRoll = false;
    this.lastSpintaEarnedBonus = false;
    this.previewSelectionScore = 0;
    this.previewSelectionCoins = 0;
    this.previewSelectionDescription = '';
    this.isSelectionValid = false;

    if (!this.hasScoringCombinationInPool()) {
      this.handleFarkle(inPoolDice);
      return;
    }

    this.emit('stateChanged');
  }

  public toggleSelectDie(dieId: number): void {
    if (this.isGameOver || this.isInShop || this.isAwaitingFarkleResolution) return;

    const die = this.findDieById(dieId);
    if (!die) return;

    if (die.state === DieState.InPool) {
      die.state = DieState.Selected;
    } else if (die.state === DieState.Selected) {
      die.state = DieState.InPool;
    } else {
      return;
    }

    this.recalculatePreviewScore();
    this.emit('stateChanged');
  }

  public confirmSelectionAndRoll(): boolean {
    if (this.isGameOver || this.isInShop) return false;

    this.recalculatePreviewScore();
    if (!this.isSelectionValid || (this.previewSelectionScore <= 0 && this.previewSelectionCoins <= 0)) {
      return false;
    }

    this.currentPot += this.previewSelectionScore;
    this.coins += this.previewSelectionCoins;

    for (const die of this._dice) {
      if (die.state === DieState.Selected) {
        die.state = DieState.Locked;
      }
    }

    this.previewSelectionScore = 0;
    this.previewSelectionCoins = 0;
    this.previewSelectionDescription = '';
    this.isSelectionValid = false;

    if (this.areAllDiceLockedOrFrozen()) {
      this.triggerHotDice();
    } else {
      this.mustRollAfterHotDice = false;
    }

    this.rollAvailableDice();
    return true;
  }

  public bankPotAndEndTurn(): boolean {
    if (this.isGameOver || this.isInShop || this.mustRollAfterHotDice) return false;

    const selectedDice = this.getDiceByState(DieState.Selected);
    let bankedSelectionWithCoins = false;

    if (selectedDice.length > 0) {
      this.recalculatePreviewScore();
      if (!this.isSelectionValid || (this.previewSelectionScore <= 0 && this.previewSelectionCoins <= 0)) {
        return false;
      }

      this.currentPot += this.previewSelectionScore;
      this.coins += this.previewSelectionCoins;
      bankedSelectionWithCoins = this.previewSelectionCoins > 0;
      for (const die of selectedDice) {
        die.state = DieState.Locked;
      }
    } else if (this.currentPot <= 0) {
      return false;
    }

    if (this.currentPot <= 0 && !bankedSelectionWithCoins) {
      return false;
    }

    this.bankScore += this.currentPot;
    this.currentPot = 0;
    this.previewSelectionScore = 0;
    this.previewSelectionCoins = 0;
    this.previewSelectionDescription = '';
    this.isSelectionValid = false;

    this.endTurnAndAdvance();
    return true;
  }

  public clearCurrentSelection(): void {
    let changed = false;
    for (const die of this._dice) {
      if (die.state === DieState.Selected) {
        die.state = DieState.InPool;
        changed = true;
      }
    }

    if (changed) {
      this.recalculatePreviewScore();
      this.emit('stateChanged');
    }
  }

  public canTargetDieWithConsumable(type: ConsumableType, die: Die | undefined): boolean {
    if (!die || (die.state !== DieState.InPool && die.state !== DieState.Selected)) {
      return false;
    }

    if (type === ConsumableType.DadoJolly && die.value === 1) {
      return false;
    }

    return true;
  }

  public canUseConsumable(slotIndex: number): boolean {
    if (this.isGameOver || this.isInShop || this.isAwaitingFarkleResolution || this.actionUsedThisRoll) {
      return false;
    }

    if (slotIndex < 0 || slotIndex >= this.equippedConsumables.length) {
      return false;
    }

    const type = this.equippedConsumables[slotIndex];
    if (CONSUMABLE_METADATA[type].requiresDieTarget) {
      return this._dice.some((die) => this.canTargetDieWithConsumable(type, die));
    }

    switch (type) {
      case ConsumableType.Polizza:
        return this.currentPot > 0;
      case ConsumableType.Trifoglio:
        return !this.hasCloverProtection;
      default:
        return false;
    }
  }

  public useImmediateConsumable(slotIndex: number): boolean {
    if (!this.canUseConsumable(slotIndex)) return false;

    const type = this.equippedConsumables[slotIndex];
    if (CONSUMABLE_METADATA[type].requiresDieTarget) return false;

    this.equippedConsumables.splice(slotIndex, 1);
    this.actionUsedThisRoll = true;

    if (type === ConsumableType.Polizza) {
      const insuredPoints = Math.floor(this.currentPot / 2);
      this.bankScore += insuredPoints;
      this.currentPot -= insuredPoints;
      this.hotDiceLevel = 0;

      this.recalculatePreviewScore();

      if (this.bankScore >= this.currentStageTarget) {
        this.handleStageCleared();
        return true;
      }
    } else if (type === ConsumableType.Trifoglio) {
      this.hasCloverProtection = true;
    }

    this.emit('stateChanged');
    return true;
  }

  public useTargetedConsumable(slotIndex: number, dieId: number): boolean {
    if (!this.canUseConsumable(slotIndex)) return false;

    const type = this.equippedConsumables[slotIndex];
    if (!CONSUMABLE_METADATA[type].requiresDieTarget) return false;

    for (const d of this._dice) {
      if (d.state === DieState.Selected) {
        d.state = DieState.InPool;
      }
    }

    const die = this.findDieById(dieId);
    if (!this.canTargetDieWithConsumable(type, die)) return false;

    this.equippedConsumables.splice(slotIndex, 1);
    this.actionUsedThisRoll = true;

    switch (type) {
      case ConsumableType.GettoneSpinta: {
        die!.roll(this._rng);
        const dieScoresDirectly = die!.value === 1 || die!.value === 5;
        if (dieScoresDirectly || this.hasScoringCombinationInPool()) {
          this.currentPot += GameConfig.SpintaSuccessBonus;
          this.lastSpintaEarnedBonus = true;
        } else {
          this.lastSpintaEarnedBonus = false;
        }
        this.recalculatePreviewScore();
        break;
      }

      case ConsumableType.GhiaccioSecco:
        die!.state = DieState.Frozen;
        this.hotDiceLevel++;
        this.recalculatePreviewScore();

        if (this.areAllDiceLockedOrFrozen()) {
          this.triggerHotDice();
          this.rollAvailableDice();
          return true;
        }
        break;

      case ConsumableType.DadoJolly:
        die!.value = 1;
        this.recalculatePreviewScore();
        break;
    }

    this.emit('stateChanged');
    return true;
  }

  // =========================================================================
  // NEGOZIO INTER-STAGE
  // =========================================================================

  public get canBuyRepairShield(): boolean {
    return (
      this.isInShop &&
      this.coins >= GameConfig.ShopCostRepairShield &&
      this.remainingShields < GameConfig.MaxShields
    );
  }

  public buyRepairShield(): boolean {
    if (!this.canBuyRepairShield) return false;
    this.coins -= GameConfig.ShopCostRepairShield;
    this.remainingShields++;
    this.emit('stateChanged');
    return true;
  }

  public get canBuyShopConsumable(): boolean {
    return (
      this.isInShop &&
      this.coins >= GameConfig.ShopCostConsumable &&
      this.equippedConsumables.length < GameConfig.MaxConsumableSlots
    );
  }

  public buyShopConsumable(): ConsumableType | null {
    if (!this.canBuyShopConsumable) return null;
    const purchased = this.shopOfferedConsumable;
    this.coins -= GameConfig.ShopCostConsumable;
    this.equippedConsumables.push(purchased);
    this.shopOfferedConsumable = this.rollRandomConsumable();
    this.emit('stateChanged');
    return purchased;
  }

  public sellShopConsumable(slotIndex: number): ConsumableType | null {
    if (!this.isInShop || slotIndex < 0 || slotIndex >= this.equippedConsumables.length) {
      return null;
    }
    const [sold] = this.equippedConsumables.splice(slotIndex, 1);
    this.coins += GameConfig.ShopConsumableSellValue;
    this.emit('stateChanged');
    return sold;
  }

  public rerollShopConsumable(cost: number = GameConfig.ShopCostReroll): boolean {
    if (!this.isInShop || this.coins < cost) return false;
    this.coins -= cost;
    const previous = this.shopOfferedConsumable;
    let next = this.rollRandomConsumable();
    if (ALL_CONSUMABLE_TYPES.length > 1) {
      for (let attempt = 0; attempt < 4 && next === previous; attempt++) {
        next = this.rollRandomConsumable();
      }
    }
    this.shopOfferedConsumable = next;
    this.emit('stateChanged');
    return true;
  }

  public hasStandardDieInPersistentPool(): boolean {
    return this._persistentPoolTypes.some((t) => t === DieType.Standard);
  }

  public buyRandomSpecialDie(): DieType | null {
    if (!this.isInShop || this.coins < GameConfig.ShopCostSpecialDie) return null;

    const standardIndices: number[] = [];
    for (let i = 0; i < this._persistentPoolTypes.length; i++) {
      if (this._persistentPoolTypes[i] === DieType.Standard) {
        standardIndices.push(i);
      }
    }
    if (standardIndices.length === 0) return null;

    this.coins -= GameConfig.ShopCostSpecialDie;
    const chosenSlot = standardIndices[Math.floor(this._rng() * standardIndices.length)];
    const newSpecialType = SPECIAL_DIE_CANDIDATES[Math.floor(this._rng() * SPECIAL_DIE_CANDIDATES.length)];
    this._persistentPoolTypes[chosenSlot] = newSpecialType;

    if (chosenSlot < this._dice.length) {
      this._dice[chosenSlot].type = newSpecialType;
    }

    this.emit('stateChanged');
    return newSpecialType;
  }

  public get trisUpgradeCost(): number {
    return (
      GameConfig.ShopCostTrisMultiplierUpgrade +
      this.trisUpgradesBought * GameConfig.ShopCostTrisMultiplierStep
    );
  }

  public buyTrisMultiplierUpgrade(): boolean {
    const cost = this.trisUpgradeCost;
    if (!this.isInShop || this.coins < cost) return false;
    this.coins -= cost;
    this.trisUpgradesBought++;
    this.trisBaseMultiplier += 0.5;
    this.emit('stateChanged');
    return true;
  }

  private rollNextAnteBoss(previous: BossType): BossType {
    const candidates = BOSS_CANDIDATES.filter((b) => b !== previous);
    if (candidates.length === 0) return previous;
    return candidates[Math.floor(this._rng() * candidates.length)];
  }

  public advanceToNextStage(): boolean {
    if (!this.isInShop) return false;
    const justClearedBoss = isBossStage(this.currentStage);
    this.isInShop = false;
    this.currentStage = this.isEndlessMode
      ? this.currentStage + 1
      : Math.min(GameConfig.TotalStages, this.currentStage + 1);
    if (justClearedBoss) {
      this.anteBoss = this.rollNextAnteBoss(this.anteBoss);
    }
    this.startStageInternal();
    return true;
  }

  public enterEndlessMode(): boolean {
    if (!this.isGameOver || !this.isVictory || this.isEndlessMode) return false;
    this.isEndlessMode = true;
    this.isGameOver = false;
    this.isVictory = false;
    this.isInShop = true;
    this.shopOfferedConsumable = this.rollRandomConsumable();
    this.emit('stateChanged');
    this.emit('shopOpened');
    return true;
  }

  private handleStageCleared(): void {
    this.hotDiceLevel = 0;
    this.mustRollAfterHotDice = false;
    this.actionUsedThisRoll = false;
    this.hasCloverProtection = false;
    this.previewSelectionScore = 0;
    this.previewSelectionCoins = 0;
    this.previewSelectionDescription = '';
    this.isSelectionValid = false;

    const overkill = Math.max(0, this.bankScore - this.currentStageTarget);
    const rawBonusCoins = Math.floor(overkill / GameConfig.OverkillPointsPerCoin);
    const bonusCoins = Math.min(GameConfig.MaxOverkillBonusCoins, rawBonusCoins);
    const earnedCoins = GameConfig.StageClearBaseCoins + bonusCoins;

    this.lastStageOverkillPoints = overkill;
    this.lastStageCoinsEarned = earnedCoins;
    this.coins += earnedCoins;

    if (this.currentStage < GameConfig.TotalStages || this.isEndlessMode) {
      this.isInShop = true;
      this.shopOfferedConsumable = this.rollRandomConsumable();
      this.emit('stateChanged');
      this.emit('shopOpened');
      return;
    }

    this.isGameOver = true;
    this.isVictory = true;
    this.emit('stateChanged');
    this.emit('gameOver');
  }

  private triggerHotDice(): void {
    const step = this.currentBoss === BossType.Fornace ? GameConfig.FornaceHotDiceLevelStep : 1;
    this.hotDiceLevel += step;
    this.resetDicePool(GameConfig.DefaultDiceCount);
    this.mustRollAfterHotDice = false;
    this.emit('hotDice');
  }

  private handleFarkle(inPoolDice: Die[]): void {
    if (this.hasCloverProtection) {
      this.hasCloverProtection = false;
      this.lastFarkleUsedClover = true;
      this.lastFarkleConsumedShield = false;

      if (this.deferFarkleTurnAdvance) {
        this.isAwaitingFarkleResolution = true;
        this.emit('farkle');
        this.emit('stateChanged');
        return;
      }

      this.emit('farkle');
      do {
        this.rollDiceList(inPoolDice);
      } while (!this.hasScoringCombinationInPool());
      this.emit('stateChanged');
      return;
    }

    this.lastFarkleUsedClover = false;

    if (this.remainingShields > 0) {
      this.remainingShields--;
      this.lastFarkleConsumedShield = true;

      if (this.deferFarkleTurnAdvance) {
        this.isAwaitingFarkleResolution = true;
        this.emit('farkle');
        this.emit('stateChanged');
        return;
      }

      this.emit('farkle');
      do {
        this.rollDiceList(inPoolDice);
      } while (!this.hasScoringCombinationInPool());
      this.emit('stateChanged');
      return;
    }

    this.lastFarkleConsumedShield = false;
    this.currentPot = 0;
    this.previewSelectionScore = 0;
    this.previewSelectionCoins = 0;
    this.previewSelectionDescription = '';
    this.isSelectionValid = false;

    if (this.deferFarkleTurnAdvance) {
      this.isAwaitingFarkleResolution = true;
      this.emit('farkle');
      this.emit('stateChanged');
      return;
    }

    this.emit('farkle');
    this.endTurnAndAdvance();
  }

  public completePendingFarkleTurn(): void {
    if (!this.isAwaitingFarkleResolution) return;
    this.isAwaitingFarkleResolution = false;

    if (this.lastFarkleUsedClover || this.lastFarkleConsumedShield) {
      const inPoolDice = this.getDiceByState(DieState.InPool);
      if (inPoolDice.length > 0) {
        do {
          this.rollDiceList(inPoolDice);
        } while (!this.hasScoringCombinationInPool());
      }
      this.emit('stateChanged');
      return;
    }

    this.endTurnAndAdvance();
  }

  private endTurnAndAdvance(): void {
    this.hotDiceLevel = 0;
    this.mustRollAfterHotDice = false;
    this.actionUsedThisRoll = false;
    this.hasCloverProtection = false;
    this.previewSelectionScore = 0;
    this.previewSelectionCoins = 0;
    this.previewSelectionDescription = '';
    this.isSelectionValid = false;

    if (this.bankScore >= this.currentStageTarget) {
      this.handleStageCleared();
      return;
    }

    if (this.currentTurn >= this.maxTurns) {
      this.isGameOver = true;
      this.isVictory = false;
      this.emit('stateChanged');
      this.emit('gameOver');
      return;
    }

    this.currentTurn++;
    this._isFirstRollOfTurn = true;
    this.resetDicePool(GameConfig.DefaultDiceCount);
    this.applyBossTurnStartEffects();
    this.rollAvailableDice();
  }

  private applyBossTurnStartEffects(): void {
    if (this.currentBoss !== BossType.GeloPerenne) return;

    const candidates = this._dice.filter((d) => d.state === DieState.InPool);
    const toFreeze = Math.min(GameConfig.GeloPerenneStartingFrozenDice, candidates.length);
    for (let i = 0; i < toFreeze; i++) {
      const pick = Math.floor(this._rng() * candidates.length);
      candidates[pick].state = DieState.Frozen;
      candidates.splice(pick, 1);
    }
  }

  private recalculatePreviewScore(): void {
    const selectedDice = this.getDiceByState(DieState.Selected);
    if (selectedDice.length === 0) {
      this.previewSelectionScore = 0;
      this.previewSelectionCoins = 0;
      this.previewSelectionDescription = '';
      this.isSelectionValid = false;
      return;
    }

    const result = ScoreEvaluator.evaluate(
      selectedDice,
      this.hotDiceLevel,
      this.trisBaseMultiplier,
      this.currentBoss
    );
    this.isSelectionValid = result.isValidSelection;
    this.previewSelectionScore = result.isValidSelection ? result.score * this.multiplier : 0;
    this.previewSelectionCoins = result.isValidSelection ? result.bonusCoins : 0;
    this.previewSelectionDescription = result.isValidSelection
      ? ScoreEvaluator.describeSelection(selectedDice, this.hotDiceLevel, this.currentBoss)
      : '';
  }

  private hasScoringCombinationInPool(): boolean {
    const inPoolValues = this._dice
      .filter((d) => d.state === DieState.InPool)
      .map((d) => d.value);
    return ScoreEvaluator.hasAnyScoringCombination(inPoolValues);
  }

  private areAllDiceLockedOrFrozen(): boolean {
    return (
      this._dice.length > 0 &&
      this._dice.every((d) => d.state === DieState.Locked || d.state === DieState.Frozen)
    );
  }

  private resetDicePool(count: number): void {
    this._dice.length = 0;
    for (let i = 0; i < count; i++) {
      const dieType = i < this._persistentPoolTypes.length ? this._persistentPoolTypes[i] : DieType.Standard;
      this._dice.push(new Die(i, Die.MinValue, DieState.InPool, dieType));
    }
  }

  private rollDiceList(diceToRoll: Die[]): void {
    for (const die of diceToRoll) {
      die.roll(this._rng);
    }
  }

  private getDiceByState(state: DieState): Die[] {
    return this._dice.filter((d) => d.state === state);
  }

  private findDieById(dieId: number): Die | undefined {
    return this._dice.find((d) => d.id === dieId);
  }
}
