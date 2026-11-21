import React from 'react';
import { Die, DieState, DieType } from '../core/die';
import { DieView } from './DieView';
import { GameIcons } from './Icons';

interface HomeScreenProps {
  muted: boolean;
  onStartGame: () => void;
  onOpenRules: () => void;
  onToggleMute: () => void;
}

const SHOWCASE_DIE_1 = new Die(0, 1, DieState.InPool, DieType.Standard);
const SHOWCASE_DIE_2 = new Die(1, 5, DieState.InPool, DieType.Golden);

export const HomeScreen: React.FC<HomeScreenProps> = ({
  muted,
  onStartGame,
  onOpenRules,
  onToggleMute,
}) => {
  return (
    <div className="home-layout">
      <div className="home-top-bar">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleMute}
          aria-label={muted ? 'Attiva audio' : 'Disattiva audio'}
        >
          {muted ? <GameIcons.SoundOff size={20} /> : <GameIcons.SoundOn size={20} />}
        </button>
      </div>

      <div className="home-center-box">
        <div className="home-brand-row">
          <GameIcons.DiceFire size={66} className="home-fire-icon" />
          <h1 className="home-title">HOT FARKLE</h1>
        </div>

        <div className="home-showcase-dice">
          <div className="showcase-die showcase-die-left">
            <DieView die={SHOWCASE_DIE_1} disabled />
          </div>
          <div className="showcase-die showcase-die-right">
            <DieView die={SHOWCASE_DIE_2} disabled />
          </div>
        </div>

        <div className="home-actions">
          <button type="button" className="btn btn-gold btn-full btn-hero" onClick={onStartGame}>
            <GameIcons.Play size={22} /> GIOCA
          </button>
          <button type="button" className="btn btn-ghost btn-full home-rules-btn" onClick={onOpenRules}>
            <GameIcons.Rules size={20} /> REGOLE
          </button>
        </div>
      </div>
    </div>
  );
};
