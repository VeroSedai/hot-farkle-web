import React from 'react';
import { Die, DieState, DieType } from '../core/die';
import { BOSS_CANDIDATES } from '../core/farkleGameManager';
import { BOSS_METADATA, BossType } from '../data/bossType';
import { useI18n } from '../i18n/I18nContext';
import type { PlayerStats } from '../utils/stats';
import { DieView } from './DieView';
import { BossIcon, GameIcons } from './Icons';

interface HomeScreenProps {
  muted: boolean;
  darkMode: boolean;
  stats: PlayerStats;
  isDevMode?: boolean;
  onStartGame: () => void;
  onStartBossTest?: (boss: BossType) => void;
  onOpenDevShop?: () => void;
  onOpenRules: () => void;
  onToggleMute: () => void;
  onToggleDarkMode: () => void;
}

const SHOWCASE_DIE_1 = new Die(0, 1, DieState.InPool, DieType.Standard);
const SHOWCASE_DIE_2 = new Die(1, 5, DieState.InPool, DieType.Golden);

export const HomeScreen: React.FC<HomeScreenProps> = ({
  muted,
  darkMode,
  stats,
  isDevMode = false,
  onStartGame,
  onStartBossTest,
  onOpenDevShop,
  onOpenRules,
  onToggleMute,
  onToggleDarkMode,
}) => {
  const { lang, toggleLang, t } = useI18n();
  const hasStats = stats.runsPlayed > 0 || stats.bestPot > 0;

  return (
    <div className="home-layout">
      <div className="home-top-bar">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? t('home.themeLight') : t('home.themeDark')}
          title={darkMode ? t('home.themeLight') : t('home.themeDark')}
        >
          {darkMode ? <GameIcons.Sun size={20} /> : <GameIcons.Moon size={20} />}
        </button>
        <button
          type="button"
          className="icon-btn lang-btn"
          onClick={toggleLang}
          aria-label={t('home.langLabel')}
          title={t('home.langLabel')}
        >
          {lang.toUpperCase()}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleMute}
          aria-label={muted ? t('home.muteOn') : t('home.muteOff')}
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
            <GameIcons.Play size={22} /> {t('home.play')}
          </button>
          <button type="button" className="btn btn-ghost btn-full home-rules-btn" onClick={onOpenRules}>
            <GameIcons.Rules size={20} /> {t('home.rules')}
          </button>
        </div>

        {hasStats && (
          <div className="home-stats-strip">
            <div className="home-stat-item">
              <span className="home-stat-val">
                {stats.runsWon}/{stats.runsPlayed}
              </span>
              <span className="home-stat-lbl">{t('home.statsWins')}</span>
            </div>
            <div className="home-stat-item">
              <span className="home-stat-val">{stats.bestPot}</span>
              <span className="home-stat-lbl">{t('home.statsBestPot')}</span>
            </div>
            <div className="home-stat-item">
              <span className="home-stat-val">{stats.bestBank}</span>
              <span className="home-stat-lbl">{t('home.statsBestBank')}</span>
            </div>
          </div>
        )}
        {isDevMode && onStartBossTest && (
          <div className="dev-boss-panel">
            <div className="dev-boss-header">
              <span className="dev-boss-label">DEV · BOSS TEST (STAGE 3)</span>
              {onOpenDevShop && (
                <button
                  type="button"
                  className="dev-boss-btn dev-shop-btn"
                  style={{ '--boss-color': '#ffbe0b' } as React.CSSProperties}
                  onClick={onOpenDevShop}
                >
                  <GameIcons.Coins size={14} />
                  <span>SHOP PREVIEW</span>
                </button>
              )}
            </div>
            <div className="dev-boss-grid">
              {BOSS_CANDIDATES.map((boss) => (
                <button
                  key={boss}
                  type="button"
                  className="dev-boss-btn"
                  style={{ '--boss-color': BOSS_METADATA[boss].themeColorHex } as React.CSSProperties}
                  onClick={() => onStartBossTest(boss)}
                  title={t(`bosses.${boss}.desc`)}
                >
                  <BossIcon boss={boss} size={14} />
                  <span>{t(`bosses.${boss}.name`)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
