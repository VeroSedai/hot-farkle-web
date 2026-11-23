import React from 'react';
import { Die, DieState, DieType } from '../core/die';
import { useI18n } from '../i18n/I18nContext';
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

export const DieView: React.FC<DieViewProps> = ({
  die,
  compact = false,
  isTargeting = false,
  isValidTarget = false,
  disabled = false,
  rolling = false,
  onClick,
}) => {
  const { t } = useI18n();
  const activePips = PIP_GRID_MAP[die.value] ?? [4];
  const isCrimsonAce = die.value === 1 && die.state !== DieState.Locked && die.state !== DieState.Frozen;

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
      aria-label={t('die.ariaLabel', { id: die.id + 1, value: die.value, state: die.state })}
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
      </div>

      {die.state === DieState.Frozen && (
        <span className="die-corner-icon die-corner-frozen">
          <GameIcons.Snowflake size={compact ? 11 : 15} />
        </span>
      )}

      {die.state !== DieState.Frozen && die.type === DieType.Golden && (
        <span className="die-corner-icon die-corner-golden">
          <GameIcons.Crown size={compact ? 11 : 14} />
        </span>
      )}

      {die.state !== DieState.Frozen && die.type === DieType.Loaded && (
        <span className="die-corner-icon die-corner-loaded">
          <GameIcons.Magnet size={compact ? 11 : 14} />
        </span>
      )}

      {die.state !== DieState.Frozen && die.type === DieType.Multiplier && (
        <span className="die-corner-icon die-corner-multiplier">×2</span>
      )}

      {die.state !== DieState.Frozen && die.type === DieType.Merchant && (
        <span className="die-corner-icon die-corner-merchant">
          <GameIcons.Coins size={compact ? 11 : 14} />
        </span>
      )}

      {die.state !== DieState.Frozen && die.type === DieType.Volatile && (
        <span className="die-corner-icon die-corner-volatile">
          <GameIcons.Flame size={compact ? 11 : 14} />
        </span>
      )}
    </button>
  );
};
