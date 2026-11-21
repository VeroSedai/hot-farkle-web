# Hot Farkle Web

**Hot Farkle** is a fast-paced, roguelike dice game built for the web with React, TypeScript, and Vite. Inspired by traditional **Farkle** and modern deck/dice-builders, you push your luck across escalating stages, customize your dice pool, use tactical consumables, and survive unique Boss modifiers.

---

## Gameplay Overview

Each run consists of **3 Stages** with increasing point targets (**1,000** → **1,800** → **2,800** points). You have **4 turns per stage** (unless modified by a Boss) to reach the target Bank score.

### Core Loop
1. **Roll & Select**: Roll 6 dice and select valid scoring combinations.
2. **Keep & Roll vs. Bank**:
   - **Keep & Roll (`TIENI & TIRA`)**: Lock your selected dice into the pot and roll the remaining dice to build a bigger score.
   - **Bank (`INCASSA`)**: Secure your current pot into the Stage Bank and end your turn.
3. **Hot Dice**: If all 6 dice are locked or frozen, you trigger **Hot Dice!** — your pot multiplier increases (`x2`, `x3`, up to `x4`) and all un-frozen dice return to your active pool for a massive combo turn.
4. **Farkle & Shields**: If a roll produces zero valid scoring dice, you **Farkle**!
   - **Grace Roll**: Your very first roll of a turn is always protected against Farkle.
   - **Anti-Farkle Shields**: You start each run with **2 Shields**. If you Farkle while holding a Shield (or active Clover protection), the Farkle is canceled and you get a free reroll instead of losing your pot.
5. **The Shop**: Clearing a stage rewards base coins plus bonus coins for every **500 overkill points**. Spend coins between stages to upgrade your dice, buy consumables, repair shields, or boost your Three-of-a-Kind multiplier.

---

## Scoring & Combinations

| Combination | Base Score | Notes |
| :--- | :--- | :--- |
| **Single `1`** | `100` pts | `250` pts with a **Golden Die** |
| **Single `5`** | `50` pts | `100` pts with a **Golden Die** |
| **Low Straight (`1-2-3-4-5`)** | `500` pts | Requires all 5 dice in a single selection |
| **High Straight (`2-3-4-5-6`)** | `750` pts | Requires all 5 dice in a single selection |
| **Full Straight (`1-2-3-4-5-6`)** | `1,500` pts | All 6 dice in a single selection |
| **Three of a Kind (`1-1-1`)** | `1,000` pts | Multiplied by your permanent Tris Bonus |
| **Three of a Kind (`N-N-N`, 2–6)** | `N × 100` pts | e.g., `4-4-4` = `400` pts |
| **4 / 5 / 6 of a Kind** | `×2` / `×4` / `×8` | Each extra matching die after Three of a Kind doubles the combo score |

---

## Roguelike Mechanics

### Special Dice
Upgrade standard dice in the Shop to permanently enhance your 6-die pool for the rest of the run:
- **Golden Die (`Dado Oro`)**: Single `1`s score **250 pts** (instead of 100) and single `5`s score **100 pts** (instead of 50).
- **Loaded Die (`Dado Truccato`)**: Weighted faces (`1, 1, 5, 5, 3, 6`) for much higher consistency.
- **Multiplier Die (`Dado Moltiplicatore x2`)**: Doubles the score of any valid selection it is locked into.

### Consumables (Max 2 Slots)
- **Push Token (`Gettone Spinta`)**: Reroll 1 target die; grants **+150 bonus pts** if it lands on a scoring face (`1` or `5`).
- **Dry Ice (`Ghiaccio Secco`)**: Freeze 1 target die for the rest of the turn and immediately gain **+1x Pot Multiplier**.
- **Insurance Policy (`Polizza`)**: Immediately bank **50%** of your current pot safely and reset your multiplier to `x1`.
- **Wild Die (`Dado Jolly`)**: Turn 1 target die into a `1`.
- **Four-Leaf Clover (`Trifoglio`)**: Protects you from your next Farkle during the current turn, granting a free reroll.

### Stage 3 Boss Modifiers
At the start of a run, a random Boss rule is rolled for **Stage 3**:
- **Permafrost (`Gelo Perenne`)**: 1 random die starts **Frozen** at the beginning of every turn.
- **The Furnace (`Fornace`)**: You only have **3 turns** to clear the stage, but triggering **Hot Dice** increases your multiplier by **+2x** per trigger.
- **The Tax Collector (`Esattore`)**: Single `5`s score **0 points**, but each locked `5` grants **+1 Coin**.

---

## Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool & Dev Server**: [Vite 6](https://vite.dev/)
- **Unit Testing**: [Vitest](https://vitest.dev/)
- **Audio & Visuals**: Custom Web Audio API sound synthesizer + HTML5 Canvas animated swirl background

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` (included with Node.js)

### Installation

```bash
# Install dependencies
npm install
```

### Development

Start the local Vite development server with hot module replacement (HMR):

```bash
npm run dev
```

### Testing

Run the automated test suite (scoring engine, consumables, boss rules, and game state management):

```bash
npm test
```

### Production Build

Compile TypeScript and bundle the application for production into the `dist/` folder:

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
├── public/                 # Static assets and audio tracks
├── src/
│   ├── components/         # React UI components (Table, HUD, Shop, Modals, Canvas background)
│   ├── core/               # Framework-agnostic game logic (Die, FarkleScorer, FarkleGameManager)
│   ├── data/               # Game balance constants, Boss metadata, and Consumable definitions
│   ├── utils/              # Audio manager and helper utilities
│   ├── App.tsx             # Main application state & screen orchestration
│   ├── index.css           # Mobile-first responsive styling and animations
│   └── main.tsx            # React DOM entry point
├── tests/                  # Vitest unit tests for core game mechanics
├── package.json
└── vite.config.ts
```
