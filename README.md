# Hot Farkle Web


<img width="519" height="365" alt="image" src="https://github.com/user-attachments/assets/19ed8145-8e29-4f70-9675-3688ac03632e" />


**Hot Farkle** is a fast-paced, roguelike dice game built for the web with React, TypeScript, and Vite. Inspired by classic **Farkle** and modern deck/dice-builders, you push your luck across 3 Antes (9 escalating stages) plus Endless Mode, customize your 6-die pool, equip passive Relics, use tactical consumables, and adapt to unique Boss modifiers.

---

## Gameplay Overview

Each run spans **3 Antes (9 Stages)** with escalating point targets:
- **Ante 1 (Stages 1–3)**: `750` → `1,400` → `2,200` (Boss 1)
- **Ante 2 (Stages 4–6)**: `3,000` → `4,000` → `5,200` (Boss 2)
- **Ante 3 (Stages 7–9)**: `6,800` → `8,800` → `11,500` (Boss 3)
- **Endless Mode (Stage 10+)**: Unlocked after beating Stage 9, with targets scaling exponentially (`×1.75` per stage).

You have **4 turns per stage** (3 against *Furnace*) to reach the target Bank score.

### Core Loop
1. **Roll & Select**: Roll 6 dice and select valid scoring combinations.
2. **Keep & Roll vs. Bank**:
   - **Keep & Roll (`TIENI & TIRA`)**: Lock your selected dice into the pot and roll the remaining dice to build a bigger score.
   - **Bank (`INCASSA`)**: Secure your current pot into the Stage Bank and end your turn.
3. **Hot Dice**: If all 6 dice are locked or frozen, you trigger **Hot Dice!** — your pot multiplier increases (`x2`, `x3`, up to **`x8`**) and all un-frozen dice return to your active pool.
4. **Farkle & Shields**: If a roll produces zero valid scoring dice (or a **Volatile** die explodes on roll 3+), you **Farkle**!
   - **Grace Roll**: Your first roll of a turn is protected against normal Farkles.
   - **Anti-Farkle Shields**: You start each run with **2 Shields** (max **3**). If you Farkle while holding a Shield (or active Clover protection), the Farkle is canceled and you get a free reroll instead of losing your pot.
5. **The Shop**: Clearing a stage awards base coins (`3`) plus bonus coins for every **500 overkill points** (up to `+5`). Between stages, spend coins in the Shop to repair shields, buy/reroll/sell consumables and Relics, upgrade your dice (with visible offers & rerolls), or boost your permanent Three-of-a-Kind multiplier. Before any Boss stage, the Shop displays a **Next Boss** preview.

---

## Scoring & Combinations

| Combination | Base Score | Notes |
| :--- | :--- | :--- |
| **Single `1`** | `100` pts | `250` pts with a **Golden Die** |
| **Single `5`** | `50` pts | `100` pts with a **Golden Die** (`0` pts + `1` Coin under *Tax Collector*) |
| **Pairs** *(Relic)* | `50%` of base Trips | Unlocked by **Cheater's Monocle** (`1-1` = `500`, `2-2` = `100`, ..., `6-6` = `300`) |
| **Low Straight (`1-2-3-4-5`)** | `500` pts | `+50%` under *Purist* |
| **High Straight (`2-3-4-5-6`)** | `750` pts | `+50%` under *Purist* |
| **Full Straight (`1-2-3-4-5-6`)** | `1,500` pts | `+50%` under *Purist* |
| **Three of a Kind (`1-1-1`)** | `1,000` pts | Multiplied by your permanent Trips Bonus (`0.5x` under *Purist*) |
| **Three of a Kind (`N-N-N`, 2–6)** | `N × 100` pts | e.g., `4-4-4` = `400` pts (`0.5x` under *Purist*) |
| **4 / 5 / 6 of a Kind** | `×2` / `×4` / `×8` | Each extra matching die after Three of a Kind doubles the combo score |

---

## Roguelike Mechanics

### Special Dice (5 Types)
Upgrade standard dice in the Shop (visible offer + `1`-Coin reroll) to permanently customize your 6-die pool:
- **Golden Die (`Dado Oro`)**: Single `1`s score **250 pts** and single `5`s score **100 pts**.
- **Loaded Die (`Dado Truccato`)**: Weighted faces (`1, 1, 5, 5, 3, 6`) for higher consistency.
- **Multiplier Die (`Dado x2`)**: Doubles the score of any valid selection it is locked into.
- **Merchant Die (`Dado Mercante`)**: Grants **+1 Coin** whenever locked in a valid selection.
- **Volatile Die (`Dado Ardente`)**: Grants **+250 bonus pts** if locked on the **1st roll** of a turn, but **explodes (Farkle)** if left in the pool on the **3rd+ roll**.

### Passive Relics (Max 2 Slots)
Equip permanent passive bonuses in the Shop (`5` Coins to buy, `2` Coins refund on sell, `1` Coin to reroll):
- **Golden Tooth (`Dente d'Oro`)**: **+10%** Bank points for every Coin you currently hold.
- **Frost Gauntlet (`Guanto di Ghiaccio`)**: Each **Frozen** die adds **+1x** to your multiplier.
- **Ember Core (`Fiamma Residua`)**: Your Hot Dice multiplier only drops by **-1x** between turns instead of resetting to `x1`.
- **Cheater's Monocle (`Monocolo del Baro`)**: **Pairs** become valid scoring combinations worth **50%** of base Three-of-a-Kind.
- **Long Fuse (`Miccia Lunga`)**: **Volatile** dice keep their `+250` bonus on the **2nd roll** too and only explode on the **4th+ roll**.

### Consumables (Max 2 Slots)
- **Nudge Token (`Gettone Spinta`)**: Reroll 1 target die; grants **+150 bonus pts** into the Pot if it lands on `1`, `5`, or completes a scoring combo (never causes a Farkle).
- **Dry Ice (`Ghiaccio Secco`)**: Freeze 1 target die for the rest of the turn and immediately gain **+1x Pot Multiplier**.
- **Insurance (`Polizza`)**: Immediately bank **50%** of your current pot safely and reset your multiplier to `x1`.
- **Wild Die (`Dado Jolly`)**: Turn 1 target die into a `1`.
- **Clover (`Trifoglio`)**: Negates your next Farkle during the current turn, granting a free reroll.

### Boss Modifiers (Stages 3, 6, 9 & Every 3rd Endless Stage)
All 3 Bosses in a 3-Ante run are drawn from a non-repeating bag so you never face the same Boss twice in a run:
- **Permafrost (`Gelo Perenne`)**: 1 random die starts **Frozen** at the beginning of every turn.
- **Furnace (`Fornace`)**: Only **3 turns** per stage, but triggering **Hot Dice** increases your multiplier by **+2x** per trigger.
- **Tax Collector (`Esattore`)**: Single `5`s score **0 pts**, but each locked `5` grants **+1 Coin**.
- **Loan Shark (`Usuraio`)**: You can only **Bank** when your total Pot is at least **450 pts**.
- **Purist (`Purista`)**: Three-of-a-Kind+ combos are **halved**, while **Straights** score **+50%**.

---

## Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Build Tool & Dev Server**: [Vite 6](https://vite.dev/)
- **Unit & Balance Testing**: [Vitest](https://vitest.dev/) (including 300-run Monte Carlo simulations)
- **Audio & Visuals**: Web Audio API sample engine (`public/audio/*.wav`, semitone-pitched lock progression, priority ducking) + Neo-Brutalism Pop responsive CSS UI

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` (included with Node.js)

### Installation

```bash
npm install
```

### Development

Start the local Vite dev server (includes the dev-only **Boss Test** and **Shop Preview** tools, automatically stripped from production builds):

```bash
npm run dev
```

### Testing

Run the Vitest suite (scoring rules, bosses, special dice, relics, and Monte Carlo balance simulations):

```bash
npm test
```

### Production Build

Compile TypeScript and bundle into `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Project Structure

```text
hot-farkle-web/
├── .github/workflows/          # GitHub Pages CI/CD (tests + build + deploy)
├── public/
│   ├── audio/                  # BGM & WAV sound effects
│   ├── fonts/                  # Custom typography assets
│   └── manifest.webmanifest    # PWA metadata
├── src/
│   ├── components/             # React UI (DieView, HomeScreen, ShopOverlay, Modals, Icons, SwirlBackground)
│   ├── core/                   # Framework-agnostic game logic & Vitest suite
│   │   ├── die.ts
│   │   ├── scoreEvaluator.ts
│   │   ├── farkleGameManager.ts
│   │   └── farkleGameManager.test.ts
│   ├── data/                   # Config, BossType, ConsumableType, RelicType
│   ├── i18n/                   # English & Italian translations (I18nContext, en.ts, it.ts)
│   ├── utils/                  # Web Audio SoundManager & localStorage stats
│   ├── App.tsx                 # Main state orchestration & game table
│   ├── index.css               # Neo-Brutalism Pop & responsive layout styling
│   └── main.tsx                # React DOM entry point
├── index.html
├── package.json
└── vite.config.ts
```
