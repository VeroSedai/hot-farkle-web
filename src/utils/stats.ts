const STATS_STORAGE_KEY = 'hotfarkle_stats';

export interface PlayerStats {
  runsPlayed: number;
  runsWon: number;
  bestPot: number;
  bestBank: number;
}

const DEFAULT_STATS: PlayerStats = {
  runsPlayed: 0,
  runsWon: 0,
  bestPot: 0,
  bestBank: 0,
};

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return {
      runsPlayed: typeof parsed.runsPlayed === 'number' ? parsed.runsPlayed : 0,
      runsWon: typeof parsed.runsWon === 'number' ? parsed.runsWon : 0,
      bestPot: typeof parsed.bestPot === 'number' ? parsed.bestPot : 0,
      bestBank: typeof parsed.bestBank === 'number' ? parsed.bestBank : 0,
    };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function saveStats(stats: PlayerStats): PlayerStats {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore storage errors
  }
  return stats;
}

export function recordBankedPot(pot: number, stageBank: number): PlayerStats {
  const current = loadStats();
  if (pot <= current.bestPot && stageBank <= current.bestBank) {
    return current;
  }
  return saveStats({
    ...current,
    bestPot: Math.max(current.bestPot, pot),
    bestBank: Math.max(current.bestBank, stageBank),
  });
}

export function recordRunEnd(isVictory: boolean, finalBank: number): PlayerStats {
  const current = loadStats();
  return saveStats({
    runsPlayed: current.runsPlayed + 1,
    runsWon: current.runsWon + (isVictory ? 1 : 0),
    bestPot: current.bestPot,
    bestBank: Math.max(current.bestBank, finalBank),
  });
}
