import { describe, expect, it } from 'vitest';
import { BossType } from '../data/bossType';
import { ConsumableType } from '../data/consumableType';
import { GameConfig, getStageTarget, isBossStage } from '../data/gameConfig';
import { RelicType } from '../data/relicType';
import { Die, DieState, DieType } from './die';
import { FarkleGameManager } from './farkleGameManager';
import { ScoreEvaluator } from './scoreEvaluator';

describe('ScoreEvaluator', () => {
  it('evaluates full straight, small straights, tris, and singles', () => {
    expect(ScoreEvaluator.evaluateValues([1, 2, 3, 4, 5, 6])).toEqual({
      score: 1500,
      isValidSelection: true,
      bonusCoins: 0,
    });

    expect(ScoreEvaluator.evaluateValues([2, 3, 4, 5, 6])).toEqual({
      score: 750,
      isValidSelection: true,
      bonusCoins: 0,
    });

    expect(ScoreEvaluator.evaluateValues([1, 1, 1])).toEqual({
      score: 1000,
      isValidSelection: true,
      bonusCoins: 0,
    });

    expect(ScoreEvaluator.evaluateValues([4, 4, 4, 4])).toEqual({
      score: 800,
      isValidSelection: true,
      bonusCoins: 0,
    });

    expect(ScoreEvaluator.evaluateValues([2])).toEqual({
      score: 0,
      isValidSelection: false,
      bonusCoins: 0,
    });
  });

  it('evaluates special dice (Golden, Multiplier) and Esattore boss', () => {
    const goldenOne = new Die(0, 1, DieState.Selected, DieType.Golden);
    const multFive = new Die(1, 5, DieState.Selected, DieType.Multiplier);
    // 250 (golden 1) + 50 (5) = 300, doubled by Multiplier = 600
    expect(ScoreEvaluator.evaluate([goldenOne, multFive])).toEqual({
      score: 600,
      isValidSelection: true,
      bonusCoins: 0,
    });

    const singleFive = new Die(0, 5, DieState.Selected, DieType.Standard);
    expect(ScoreEvaluator.evaluate([singleFive], 0, 1.0, BossType.Esattore)).toEqual({
      score: 0,
      isValidSelection: true,
      bonusCoins: 1,
    });
  });
});

describe('FarkleGameManager', () => {
  it('starts a run and banks a valid selection', () => {
    // Deterministic rng returning 0 -> all dice roll 1
    const gm = new FarkleGameManager(() => 0);
    gm.startNewRun();
    expect(gm.currentStage).toBe(1);
    expect(gm.dice.every((d) => d.value === 1)).toBe(true);

    gm.toggleSelectDie(0);
    gm.toggleSelectDie(1);
    gm.toggleSelectDie(2);
    expect(gm.isSelectionValid).toBe(true);
    expect(gm.previewSelectionScore).toBe(1000);

    const banked = gm.bankPotAndEndTurn();
    expect(banked).toBe(true);
    // 1000 reaches Stage 1 target -> opens shop
    expect(gm.isInShop).toBe(true);
    expect(gm.coins).toBe(5); // 2 starting + 3 stage clear
  });

  it('supports DadoJolly consumable to turn a die into 1', () => {
    const gm = new FarkleGameManager(() => 0.35); // rolls 3
    gm.startNewRun();
    gm.equippedConsumables.push(ConsumableType.DadoJolly);
    gm.dice[0].value = 4;

    const used = gm.useTargetedConsumable(0, 0);
    expect(used).toBe(true);
    expect(gm.dice[0].value).toBe(1);
    expect(gm.equippedConsumables.length).toBe(0);
  });

  it('allows selling an equipped consumable in the shop to free a belt slot', () => {
    const gm = new FarkleGameManager(() => 0);
    gm.startNewRun();
    gm.toggleSelectDie(0);
    gm.toggleSelectDie(1);
    gm.toggleSelectDie(2);
    gm.bankPotAndEndTurn();

    expect(gm.isInShop).toBe(true);
    gm.equippedConsumables.push(ConsumableType.Polizza, ConsumableType.Trifoglio);
    expect(gm.canBuyShopConsumable).toBe(false);

    const coinsBefore = gm.coins;
    const sold = gm.sellShopConsumable(0);
    expect(sold).toBe(ConsumableType.Polizza);
    expect(gm.equippedConsumables).toEqual([ConsumableType.Trifoglio]);
    expect(gm.coins).toBe(coinsBefore + 1);
    expect(gm.canBuyShopConsumable).toBe(true);
  });

  it('supports endless mode after TotalStages (9) victory with scaling targets', () => {
    const gm = new FarkleGameManager(() => 0); // all dice roll 1
    gm.startNewRun();
    expect(gm.currentStageTarget).toBe(750);

    // Clear stages 1..9
    for (let stage = 1; stage <= GameConfig.TotalStages; stage++) {
      gm.bankScore = gm.currentStageTarget;
      gm.currentPot = 100;
      gm.bankPotAndEndTurn();
      if (stage < GameConfig.TotalStages) {
        expect(gm.isInShop).toBe(true);
        gm.advanceToNextStage();
      }
    }

    expect(gm.isGameOver).toBe(true);
    expect(gm.isVictory).toBe(true);

    expect(gm.enterEndlessMode()).toBe(true);
    expect(gm.isEndlessMode).toBe(true);
    expect(gm.isInShop).toBe(true);

    expect(gm.advanceToNextStage()).toBe(true);
    expect(gm.currentStage).toBe(10);
    expect(gm.currentStageTarget).toBe(20100);
  });

  it('caps shields at MaxShields (3) and allows repairing when damaged', () => {
    const gm = new FarkleGameManager(() => 0);
    gm.startNewRun();
    gm.dice.forEach((d) => gm.toggleSelectDie(d.id));
    gm.bankPotAndEndTurn();

    expect(gm.isInShop).toBe(true);
    gm.coins = 20;
    expect(gm.remainingShields).toBe(2);

    // Can buy 1 shield to reach 3/3
    expect(gm.canBuyRepairShield).toBe(true);
    expect(gm.buyRepairShield()).toBe(true);
    expect(gm.remainingShields).toBe(GameConfig.MaxShields);

    // Cannot buy a 4th shield even with plenty of coins
    expect(gm.canBuyRepairShield).toBe(false);
    expect(gm.buyRepairShield()).toBe(false);
    expect(gm.remainingShields).toBe(3);
  });

  it('caps overkill bonus coins at MaxOverkillBonusCoins (+5)', () => {
    const gm = new FarkleGameManager(() => 0);
    gm.startNewRun();
    const startingCoins = gm.coins;

    // Simulate Antaniserse's 1,390,150 pot
    gm.currentPot = 1_390_150;
    expect(gm.bankPotAndEndTurn()).toBe(true);
    expect(gm.isInShop).toBe(true);

    // Base (3) + MaxOverkillBonusCoins (5) = 8 coins max earned
    expect(gm.lastStageCoinsEarned).toBe(
      GameConfig.StageClearBaseCoins + GameConfig.MaxOverkillBonusCoins
    );
    expect(gm.coins).toBe(startingCoins + 8);
  });

  it('scales Tris multiplier upgrade cost progressively (4 -> 6 -> 8 -> 10)', () => {
    const gm = new FarkleGameManager(() => 0);
    gm.startNewRun();
    gm.dice.forEach((d) => gm.toggleSelectDie(d.id));
    gm.bankPotAndEndTurn();

    gm.coins = 30;
    expect(gm.trisUpgradeCost).toBe(4);
    expect(gm.buyTrisMultiplierUpgrade()).toBe(true);
    expect(gm.trisBaseMultiplier).toBe(1.5);

    expect(gm.trisUpgradeCost).toBe(6);
    expect(gm.buyTrisMultiplierUpgrade()).toBe(true);
    expect(gm.trisBaseMultiplier).toBe(2.0);

    expect(gm.trisUpgradeCost).toBe(8);
    expect(gm.buyTrisMultiplierUpgrade()).toBe(true);
    expect(gm.trisBaseMultiplier).toBe(2.5);

    expect(gm.trisUpgradeCost).toBe(10);
    expect(gm.coins).toBe(30 - (4 + 6 + 8));
  });

  it('scales Endless targets exponentially and guarantees unique bosses across all 3 Antes', () => {
    expect(getStageTarget(1)).toBe(750);
    expect(getStageTarget(3)).toBe(2200);
    expect(getStageTarget(6)).toBe(5200);
    expect(getStageTarget(9)).toBe(11500);
    expect(getStageTarget(10)).toBe(20100);

    expect(isBossStage(3)).toBe(true);
    expect(isBossStage(4)).toBe(false);
    expect(isBossStage(5)).toBe(false);
    expect(isBossStage(6)).toBe(true);
    expect(isBossStage(9)).toBe(true);

    const gm = new FarkleGameManager(() => 0.25);
    gm.startNewRun();
    const seenBosses: BossType[] = [];

    for (let s = 1; s <= GameConfig.TotalStages; s++) {
      if (isBossStage(s)) {
        seenBosses.push(gm.currentBoss);
      } else {
        expect(gm.currentBoss).toBe(BossType.None);
      }
      gm.bankScore = gm.currentStageTarget;
      gm.currentPot = 100;
      gm.bankPotAndEndTurn();
      if (s < GameConfig.TotalStages) {
        gm.advanceToNextStage();
      }
    }

    expect(seenBosses).toHaveLength(3);
    expect(new Set(seenBosses).size).toBe(3);
  });

  it('prevents infinite immortality in Monte Carlo simulation of the "Caimano Assassino" strategy', () => {
    // Deterministic PRNG (Mulberry32)
    function createRng(seed: number) {
      let a = seed;
      return () => {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    // Helper: select all currently scoring dice in pool
    function selectScoringDice(gm: FarkleGameManager): number {
      const inPool = gm.dice.filter((d) => d.state === DieState.InPool);
      const counts = new Array<number>(7).fill(0);
      for (const d of inPool) counts[d.value]++;

      const isFullStraight = [1, 2, 3, 4, 5, 6].every((f) => counts[f] === 1);
      const isHighStraight = [2, 3, 4, 5, 6].every((f) => counts[f] >= 1);
      const isLowStraight = [1, 2, 3, 4, 5].every((f) => counts[f] >= 1);

      if (inPool.length === 6 && isFullStraight) {
        inPool.forEach((d) => gm.toggleSelectDie(d.id));
        return 6;
      }

      const used = new Set<number>();
      if (isHighStraight) {
        for (let f = 2; f <= 6; f++) {
          const die = inPool.find((d) => d.value === f && !used.has(d.id));
          if (die) {
            used.add(die.id);
            gm.toggleSelectDie(die.id);
            counts[f]--;
          }
        }
      } else if (isLowStraight) {
        for (let f = 1; f <= 5; f++) {
          const die = inPool.find((d) => d.value === f && !used.has(d.id));
          if (die) {
            used.add(die.id);
            gm.toggleSelectDie(die.id);
            counts[f]--;
          }
        }
      }

      for (const d of inPool) {
        if (used.has(d.id)) continue;
        if (counts[d.value] >= 3 || d.value === 1 || d.value === 5) {
          used.add(d.id);
          gm.toggleSelectDie(d.id);
        }
      }
      return used.size;
    }

    const TOTAL_RUNS = 300;
    let stage3Clears = 0;
    let maxStageReached = 0;
    let maxShieldsEverHeld = 0;
    let maxPotEverBanked = 0;
    const finalStages: number[] = [];

    for (let run = 0; run < TOTAL_RUNS; run++) {
      const gm = new FarkleGameManager(createRng(1000 + run));
      gm.startNewRun();

      let safetySteps = 0;
      while (!gm.isGameOver && safetySteps < 5000) {
        safetySteps++;
        maxShieldsEverHeld = Math.max(maxShieldsEverHeld, gm.remainingShields);

        if (gm.isInShop) {
          // Caimano Assassino shop priority:
          // 1. Max out shields
          while (gm.buyRepairShield()) {
            maxShieldsEverHeld = Math.max(maxShieldsEverHeld, gm.remainingShields);
          }
          // 2. Unlock all special dice
          while (gm.hasStandardDieInPersistentPool() && gm.buyRandomSpecialDie() !== null) {
            // keep buying
          }
          // 3. Upgrade Tris multiplier
          while (gm.buyTrisMultiplierUpgrade()) {
            // keep buying
          }
          gm.advanceToNextStage();
          continue;
        }

        const picked = selectScoringDice(gm);
        if (picked === 0 || !gm.isSelectionValid) {
          if (gm.canBank) gm.bankPotAndEndTurn();
          continue;
        }

        const remainingUnselected = gm.dice.filter((d) => d.state === DieState.InPool).length;
        const willHotDice = remainingUnselected === 0;
        const reachesStageTarget = gm.bankScore + gm.totalBankablePot >= gm.currentStageTarget;

        // Caimano strategy: always roll on Hot Dice, or if we have shields to burn, or if we need points on last turn
        const shouldPush =
          willHotDice ||
          gm.remainingShields >= 2 ||
          (gm.remainingShields === 1 && remainingUnselected >= 3) ||
          (!reachesStageTarget && gm.currentTurn === gm.maxTurns) ||
          (gm.totalBankablePot < 400 && remainingUnselected >= 3);

        if (shouldPush && gm.canConfirmAndRoll) {
          gm.confirmSelectionAndRoll();
        } else if (gm.canBank) {
          maxPotEverBanked = Math.max(maxPotEverBanked, gm.totalBankablePot);
          gm.bankPotAndEndTurn();
        } else if (gm.canConfirmAndRoll) {
          gm.confirmSelectionAndRoll();
        }

        // If victory at Stage 3, enter Endless Mode to test how far the build goes
        if (gm.isGameOver && gm.isVictory && !gm.isEndlessMode) {
          stage3Clears++;
          gm.enterEndlessMode();
        }
      }

      expect(gm.isGameOver).toBe(true);
      maxStageReached = Math.max(maxStageReached, gm.currentStage);
      finalStages.push(gm.currentStage);
    }

    const avgStage = (finalStages.reduce((a, b) => a + b, 0) / TOTAL_RUNS).toFixed(2);
    console.info(
      `[Monte Carlo Balance Report] Runs: ${TOTAL_RUNS} | Stage 3 WinRate: ${(
        (stage3Clears / TOTAL_RUNS) *
        100
      ).toFixed(1)}% | Avg Max Stage: ${avgStage} | Peak Stage: ${maxStageReached} | Max Shields Held: ${maxShieldsEverHeld} | Peak Single Pot: ${maxPotEverBanked}`
    );

    // 1. Shields never exceed MaxShields (3)
    expect(maxShieldsEverHeld).toBeLessThanOrEqual(GameConfig.MaxShields);
    // 2. Base game (Stage 1-3) is still fun and winnable
    expect(stage3Clears).toBeGreaterThan(50);
    // 3. No run is immortal: every single run ends before Stage 25
    expect(maxStageReached).toBeLessThan(25);
    // 4. Big dopamine pots still happen in Endless
    expect(maxPotEverBanked).toBeGreaterThan(5000);
  });

  it('halves tris and boosts straights by +50% under Purista boss', () => {
    const trisDice = [new Die(0, 4), new Die(1, 4), new Die(2, 4)];
    const trisRes = ScoreEvaluator.evaluate(trisDice, 0, 1.0, BossType.Purista);
    expect(trisRes.isValidSelection).toBe(true);
    expect(trisRes.score).toBe(200);

    const fullStraight = [
      new Die(0, 1),
      new Die(1, 2),
      new Die(2, 3),
      new Die(3, 4),
      new Die(4, 5),
      new Die(5, 6),
    ];
    const straightRes = ScoreEvaluator.evaluate(fullStraight, 0, 1.0, BossType.Purista);
    expect(straightRes.isValidSelection).toBe(true);
    expect(straightRes.score).toBe(2250);
  });

  it('requires at least UsuraioMinBankPot (450) to bank under Usuraio boss', () => {
    const gm = new FarkleGameManager(() => 0.1);
    gm.startNewRun();
    gm.currentStage = 3;
    gm.anteBoss = BossType.Usuraio;
    expect(gm.currentBoss).toBe(BossType.Usuraio);

    // 100 pts (< 450) cannot be banked
    gm.dice[0].value = 1;
    gm.dice[0].state = DieState.InPool;
    gm.dice[1].value = 2;
    gm.dice[1].state = DieState.InPool;
    gm.toggleSelectDie(0);
    expect(gm.totalBankablePot).toBe(100);
    expect(gm.canBank).toBe(false);
    expect(gm.bankPotAndEndTurn()).toBe(false);

    // 500 pts (>= 450) can be banked
    gm.currentPot = 400;
    expect(gm.totalBankablePot).toBe(500);
    expect(gm.canBank).toBe(true);
    expect(gm.bankPotAndEndTurn()).toBe(true);
    expect(gm.bankScore).toBe(500);
  });

  it('starts directly at Stage 3 against the requested boss in startBossTest', () => {
    const gm = new FarkleGameManager(() => 0.1);
    gm.startBossTest(BossType.Purista);
    expect(gm.currentStage).toBe(GameConfig.BossStageNumber);
    expect(gm.currentBoss).toBe(BossType.Purista);
    expect(gm.coins).toBe(10);
    expect(gm.isGameOver).toBe(false);
  });

  it('grants +1 coin for Merchant die and +250 first-roll bonus for Volatile die', () => {
    const merchant = new Die(0, 1, DieState.Selected, DieType.Merchant);
    const merchantRes = ScoreEvaluator.evaluate([merchant], 0, 1.0, BossType.None, false);
    expect(merchantRes.isValidSelection).toBe(true);
    expect(merchantRes.score).toBe(100);
    expect(merchantRes.bonusCoins).toBe(1);

    const volatile = new Die(1, 5, DieState.Selected, DieType.Volatile);
    const firstRollRes = ScoreEvaluator.evaluate([volatile], 0, 1.0, BossType.None, true);
    expect(firstRollRes.isValidSelection).toBe(true);
    expect(firstRollRes.score).toBe(50 + GameConfig.VolatileFirstRollBonus);

    const laterRollRes = ScoreEvaluator.evaluate([volatile], 0, 1.0, BossType.None, false);
    expect(laterRollRes.score).toBe(50);
  });

  it('explodes Volatile die on 3rd+ roll in turn and supports shop special die reroll & dev preview', () => {
    const gm = new FarkleGameManager(() => 0.0);
    gm.openDevShopPreview();
    expect(gm.isInShop).toBe(true);
    expect(gm.currentStage).toBe(2);
    expect(gm.coins).toBe(20);

    const firstOffered = gm.shopOfferedSpecialDie;
    expect(gm.rerollShopSpecialDie()).toBe(true);
    expect(gm.shopOfferedSpecialDie).not.toBe(firstOffered);

    // Volatile explosion test on 3rd roll
    gm.startNewRun();
    gm.dice[0].type = DieType.Volatile;
    gm.dice[0].state = DieState.InPool;
    gm.rollCountInTurn = 2;
    gm.rollAvailableDice(); // 3rd roll with Volatile in pool -> Farkle
    expect(gm.isAwaitingFarkleResolution || gm.remainingShields < GameConfig.StartingShields).toBe(true);
  });

  it('supports buying, selling, rerolling and effects of all 5 Relics', () => {
    const gm = new FarkleGameManager(() => 0.2);
    gm.openDevShopPreview();
    gm.shopOfferedRelic = RelicType.DenteOro;
    expect(gm.buyShopRelic()).toBe(RelicType.DenteOro);
    expect(gm.equippedRelics).toEqual([RelicType.DenteOro]);

    // Reroll & sell relic
    expect(gm.rerollShopRelic()).toBe(true);
    expect(gm.sellShopRelic(0)).toBe(RelicType.DenteOro);
    expect(gm.equippedRelics).toHaveLength(0);

    // DenteOro: +10% bank per coin
    gm.startNewRun();
    gm.equippedRelics = [RelicType.DenteOro];
    gm.coins = 5; // +50%
    gm.currentPot = 200;
    expect(gm.totalBankablePot).toBe(300);
    gm.bankPotAndEndTurn();
    expect(gm.bankScore).toBe(300);

    // GuantoGhiaccio: +1x per frozen die
    gm.startNewRun();
    gm.equippedRelics = [RelicType.GuantoGhiaccio];
    gm.dice[0].state = DieState.Frozen;
    gm.dice[1].state = DieState.Frozen;
    expect(gm.multiplier).toBe(3);

    // FiammaResidua: hotDiceLevel drops by 1 between turns
    gm.startNewRun();
    gm.equippedRelics = [RelicType.FiammaResidua];
    gm.hotDiceLevel = 3;
    gm.currentPot = 100;
    gm.bankPotAndEndTurn();
    expect(gm.hotDiceLevel).toBe(2);

    // MonocoloBaro: Pairs score half of base Tris
    const pairOfTwos = [new Die(0, 2), new Die(1, 2)];
    expect(ScoreEvaluator.evaluate(pairOfTwos, 0, 1.0, BossType.None, false, false).isValidSelection).toBe(false);
    const monoTwos = ScoreEvaluator.evaluate(pairOfTwos, 0, 1.0, BossType.None, false, true);
    expect(monoTwos.isValidSelection).toBe(true);
    expect(monoTwos.score).toBe(100);

    const pairOfOnes = [new Die(0, 1), new Die(1, 1)];
    expect(ScoreEvaluator.evaluate(pairOfOnes, 0, 1.0, BossType.None, false, true).score).toBe(500);
    expect(ScoreEvaluator.hasAnyScoringCombination([2, 2, 3, 4], true)).toBe(true);
  });

  it('prevents infinite immortality when actively buying Relics and hoarding coins with DenteOro', () => {
    function createRng(seed: number) {
      let a = seed;
      return () => {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const TOTAL_RUNS = 300;
    let maxStageReached = 0;
    let stage3Clears = 0;
    const finalStages: number[] = [];

    for (let run = 0; run < TOTAL_RUNS; run++) {
      const gm = new FarkleGameManager(createRng(5000 + run));
      gm.startNewRun();

      let safetySteps = 0;
      while (!gm.isGameOver && safetySteps < 5000) {
        safetySteps++;

        if (gm.isInShop) {
          while (gm.buyRepairShield()) {
            // repair shields first
          }
          while (gm.buyShopRelic() !== null) {
            // buy up to 2 relics
          }
          // If we don't have DenteOro, spend remaining coins on special dice & tris
          if (!gm.hasRelic(RelicType.DenteOro)) {
            while (gm.hasStandardDieInPersistentPool() && gm.buyRandomSpecialDie() !== null) {
              // buy special dice
            }
            while (gm.buyTrisMultiplierUpgrade()) {
              // upgrade tris
            }
          }
          gm.advanceToNextStage();
          continue;
        }

        const inPool = gm.dice.filter((d) => d.state === DieState.InPool);
        const counts = new Array<number>(7).fill(0);
        for (const d of inPool) counts[d.value]++;

        let picked = 0;
        const hasMonocolo = gm.hasRelic(RelicType.MonocoloBaro);
        for (const d of inPool) {
          if (
            counts[d.value] >= 3 ||
            (hasMonocolo && counts[d.value] === 2) ||
            d.value === 1 ||
            d.value === 5
          ) {
            gm.toggleSelectDie(d.id);
            picked++;
          }
        }

        if (picked === 0 || !gm.isSelectionValid) {
          if (gm.canBank) gm.bankPotAndEndTurn();
          continue;
        }

        const remaining = gm.dice.filter((d) => d.state === DieState.InPool).length;
        if ((remaining === 0 || gm.remainingShields >= 2) && gm.canConfirmAndRoll) {
          gm.confirmSelectionAndRoll();
        } else if (gm.canBank) {
          gm.bankPotAndEndTurn();
        } else if (gm.canConfirmAndRoll) {
          gm.confirmSelectionAndRoll();
        }

        if (gm.isGameOver && gm.isVictory && !gm.isEndlessMode) {
          stage3Clears++;
          gm.enterEndlessMode();
        }
      }

      expect(gm.isGameOver).toBe(true);
      maxStageReached = Math.max(maxStageReached, gm.currentStage);
      finalStages.push(gm.currentStage);
    }

    const avgStage = (finalStages.reduce((a, b) => a + b, 0) / TOTAL_RUNS).toFixed(2);
    console.info(
      `[Relics Monte Carlo] Runs: ${TOTAL_RUNS} | Stage 3 WinRate: ${(
        (stage3Clears / TOTAL_RUNS) *
        100
      ).toFixed(1)}% | Avg Max Stage: ${avgStage} | Peak Stage: ${maxStageReached}`
    );

    expect(maxStageReached).toBeLessThan(25);
  });
});
