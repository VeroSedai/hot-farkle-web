import React from 'react';
import { Die, DieState, DieType } from '../core/die';
import { GameIcons } from './Icons';

interface DieViewProps {
  die: Die;
  compact?: boolean;
  isTargeting?: boolean;
  isValidTarget?: boolean;
  disabled?: boolean;
  rolling?: boolean;
  onClick?: (dieId: number) => void;
}

// Pip positions on a 3x3 grid (indices 0..8)
const PIP_GRID_MAP: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function getTypeBadge(type: DieType): string | null {
  switch (type) {
    case DieType.Golden:
      return 'ORO';
    case DieType.Loaded:
      return 'TRUC';
    case DieType.Multiplier:
      return 'x2';
    default:
      return null;
  }
}

export const DieView: React.FC<DieViewProps> = ({
  die,
  compact = false,
  isTargeting = false,
  isValidTarget = false,
  disabled = false,
  rolling = false,
  onClick,
}) => {
  const activePips = PIP_GRID_MAP[die.value] ?? [4];
  const isCrimsonAce = die.value === 1 && die.state !== DieState.Locked && die.state !== DieState.Frozen;
  const badge = getTypeBadge(die.type);

  const classes = [
    'die-card',
    `die-state-${die.state.toLowerCase()}`,
    `die-type-${die.type.toLowerCase()}`,
    compact ? 'die-compact' : '',
    isTargeting && isValidTarget ? 'die-target-valid' : '',
    isTargeting && !isValidTarget ? 'die-target-invalid' : '',
    rolling && die.state === DieState.InPool ? 'die-rolling' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || (isTargeting && !isValidTarget)}
      onClick={() => onClick?.(die.id)}
      aria-label={`Dado ${die.id + 1}, valore ${die.value}, stato ${die.state}`}
    >
      <div className="die-depth" />
      <div className="die-face">
        <div className="die-pips">
          {Array.from({ length: 9 }, (_, idx) => {
            const hasPip = activePips.includes(idx);
            return (
              <span
                key={idx}
                className={`die-pip ${hasPip ? 'active' : ''} ${
                  hasPip && isCrimsonAce ? 'crimson' : ''
                }`}
              />
            );
          })}
        </div>
        {badge && !compact && <span className="die-badge">{badge}</span>}
      </div>

      {die.state === DieState.Frozen && (
        <span className="die-corner-icon die-corner-frozen">
          <GameIcons.Snowflake size={compact ? 11 : 15} />
        </span>
      )}
    </button>
  );
};
