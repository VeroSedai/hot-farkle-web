import React from 'react';
import { Die, DieState, DieType } from '../core/die';
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
    <span className="rules-combo-eq">=</span>
    <span className="rules-combo-score">{score}</span>
  </div>
);

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="rules-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="rules-main-title">TABELLA COMBINAZIONI E REGOLE</h2>
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
            <p className="rules-extra-note">
              Ogni dado extra dopo il tris raddoppia: 4 = x2 &bull; 5 = x4 &bull; 6 = x8
            </p>
          </div>
        </div>

        <div className="rules-cards-grid">
          <div className="rules-roguelike-card">
            <h3 style={{ color: '#f4b41a' }}>HOT DICE</h3>
            <p>Svuota tutti i dadi:</p>
            <p>1°: x2 &bull; 2°: x3 &bull; 3°+: x4</p>
          </div>

          <div className="rules-roguelike-card">
            <h3 style={{ color: '#38bdf8' }}>CONSUMABILI</h3>
            <p>2 Slot (1/lancio, Gratis):</p>
            <p>Spinta &bull; Ghiaccio &bull; Polizza</p>
            <p>Dado Jolly &bull; Trifoglio</p>
          </div>

          <div className="rules-roguelike-card">
            <h3 style={{ color: '#c084fc' }}>DADI SPECIALI</h3>
            <p>Oro: 1=250, 5=100</p>
            <p>Truccato: più 1 e 5</p>
            <p>Molt.: Combo x2</p>
          </div>
        </div>

        <div className="rules-close-wrap">
          <button type="button" className="btn btn-ghost rules-close-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
