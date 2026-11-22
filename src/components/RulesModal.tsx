import React from 'react';
import { Die, DieState, DieType } from '../core/die';
import { useI18n } from '../i18n/I18nContext';
import { DieView } from './DieView';

interface RulesModalProps {
  onClose: () => void;
}

interface ComboRowData {
  dice: number[];
  score: string;
}

const LEFT_COMBOS: ComboRowData[] = [
  { dice: [1], score: '100' },
  { dice: [5], score: '50' },
  { dice: [1, 2, 3, 4, 5], score: '500' },
  { dice: [2, 3, 4, 5, 6], score: '750' },
  { dice: [1, 2, 3, 4, 5, 6], score: '1500' },
];

const RIGHT_COMBOS: ComboRowData[] = [
  { dice: [1, 1, 1], score: '1000' },
  { dice: [2, 2, 2], score: '200' },
  { dice: [3, 3, 3], score: '300' },
  { dice: [4, 4, 4], score: '400' },
  { dice: [5, 5, 5], score: '500' },
  { dice: [6, 6, 6], score: '600' },
];

const SPECIAL_DICE_PREVIEW = [
  {
    die: new Die(0, 5, DieState.InPool, DieType.Golden),
    nameKey: 'rules.specialGold' as const,
    descKey: 'rules.specialGoldDesc' as const,
    accentClass: 'special-gold',
  },
  {
    die: new Die(1, 1, DieState.InPool, DieType.Loaded),
    nameKey: 'rules.specialLoaded' as const,
    descKey: 'rules.specialLoadedDesc' as const,
    accentClass: 'special-loaded',
  },
  {
    die: new Die(2, 6, DieState.InPool, DieType.Multiplier),
    nameKey: 'rules.specialMult' as const,
    descKey: 'rules.specialMultDesc' as const,
    accentClass: 'special-mult',
  },
];

const ComboRow: React.FC<ComboRowData> = ({ dice, score }) => (
  <div className="rules-combo-row">
    <div className="rules-combo-dice">
      {dice.map((val, idx) => (
        <DieView
          key={idx}
          die={new Die(0, val, DieState.InPool, DieType.Standard)}
          compact
          disabled
        />
      ))}
    </div>
    <span className="rules-combo-leader" aria-hidden="true" />
    <span className="rules-combo-eq">=</span>
    <span className="rules-combo-score">{score}</span>
  </div>
);

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  const { t } = useI18n();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rules-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="rules-main-title">{t('rules.title')}</h2>
        <div className="rules-divider" />

        <div className="rules-columns">
          <div className="rules-col">
            {LEFT_COMBOS.map((row, idx) => (
              <ComboRow key={idx} {...row} />
            ))}
          </div>

          <div className="rules-col">
            {RIGHT_COMBOS.map((row, idx) => (
              <ComboRow key={idx} {...row} />
            ))}
            <p className="rules-extra-note">{t('rules.extraNote')}</p>
          </div>
        </div>

        <div className="rules-roguelike-card">
          <h3 className="rules-special-heading">{t('rules.specialDiceTitle')}</h3>
          <div className="rules-special-grid">
            {SPECIAL_DICE_PREVIEW.map((item) => (
              <div key={item.accentClass} className={`rules-special-item ${item.accentClass}`}>
                <DieView die={item.die} compact disabled />
                <div className="rules-special-text">
                  <strong>{t(item.nameKey)}</strong>
                  <span>{t(item.descKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rules-close-wrap">
          <button type="button" className="btn btn-ghost rules-close-btn" onClick={onClose}>
            {t('rules.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
