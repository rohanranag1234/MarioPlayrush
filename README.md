# Rusty Run 100

An original, playable React Native platformer built with Expo, TypeScript and react-native-svg. Runs on Android, iOS and the web. All fox, landscape and interface artwork is drawn in code; no Nintendo assets are used.

## 1. Install

Use Node.js 24 LTS (tested: 24.14.1) and npm.

```bash
npm ci
```

## 2. Run in Expo

```bash
npm start
```

Open the QR code with an **Expo Go version that supports SDK 57**. On Android, scan from Expo Go; on iPhone, use the Camera app. Keep your computer and phone on the same network. This guest build uses Expo-compatible modules and needs no Firebase credentials.

If your Expo Go version does not support SDK 57, use an SDK 57 development build. Do not downgrade only React Native or only Expo: the versions here are a matched set.

For an emulator/simulator already installed:

```bash
npm run android
npm run ios  # requires macOS and Xcode
```

## 3. Open on the web

```bash
npm run web
```

For this workspace's preview:

```bash
npx expo start --web --port 8081
```

Open http://localhost:8081. Use **A/D** or **left/right arrows** to move; **Space/W/up arrow** to jump; **Escape** to pause. Touch controls support movement and jumping. Rotate your phone for a wider gameplay view.

## 4. Explore what is built

| Step              | Implemented                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Visual identity   | Responsive woodland home, original fox/vector landscapes, bundled Fredoka and Nunito Sans fonts                                       |
| Platformer engine | Gravity, jumping, collisions, pits, moving enemies, stomp chains, checkpoint, timer, flag, camera, pause/retry and three-hit guardian |
| Scoring           | Central scoring module, action point values, star logic, best scores, currency separated from score, finish/time/no-damage bonuses    |
| First world       | Ten authored platform arrangements, 3 tokens per level, coins, gems, berry/boots/shield/magnet/heart pickups and a bonus block        |
| Progression       | 100 level nodes across 10 worlds, sequential and star gates, 5 lives, 20-minute refills, free play for levels 1–10                    |
| Menus             | Level intro, selectable inventory boost, detailed result breakdown, world map, profile and nickname editing                           |
| Rewards           | Local shop, six cosmetic skins (four free), power-up inventory, UTC daily streak rewards, four claimable achievements                 |
| Preferences       | Left-handed controls, large buttons, reduced collectible motion, local-data explanation and deletion                                  |
| Persistence       | AsyncStorage for progress, inventory, rewards and preferences; backgrounding pauses gameplay                                          |

Coins collected in a run are banked on **successful completion**. Replays add coins, but total points are the sum of each level's best score. Extra life thresholds apply per run and bank on completion. Checkpoint retries preserve already-collected objects and mark the run damaged. Starts and death retries above level 10 cost one life; the first ten levels are free.

## 5. Current scope

This is a **playable guest prototype**, not a store-ready release of the entire brief.

- **Worlds 2–10 remix the ten base layouts.** Names, colors, score targets and enemy speeds change, but bespoke 90 hand-built layouts, world mechanics and ten distinct bosses are still needed. Later score targets need balancing; not every remix currently supports three stars.
- Google/Apple/email auth, cloud saves, account linking, shared leaderboards and server score validation are **not connected**. The app labels this state and never presents invented rankings.
- `CloudService` in `src/services/progress.ts` is the integration boundary. Do not use client-only scores as verified leaderboard entries. Before connecting a backend, implement token verification, owned-data rules, rate limiting, result replay/bounds checks, idempotent rewards and max-progress conflict handling.
- No sound, music, haptics, ads, real-money purchases, notifications, share sheet, translations, nickname uniqueness/profanity service or full onboarding flow yet.
- Backgrounding pauses the in-memory run; terminating/reloading the app returns home. Persistent in-progress sessions are not yet implemented.
- Fonts are bundled. A standalone app can play without a game server. Expo Go needs its development server to load initially; web offline installation/service worker support is not included.
- Native builds and 60-fps performance on real devices still require testing. The requestAnimationFrame loop uses a capped physics timestep.

## 6. Continue development, step by step

1. Playtest and tune the first ten levels on physical Android and iOS devices.
2. Add durable run recovery, animations, original audio, boss variety and remaining onboarding screens.
3. Configure a Firebase/Supabase project, platform identifiers and Google/Apple OAuth. Integrate auth in a development build and implement server-validated, idempotent scores/rewards before enabling online leaderboards.
4. Author and balance 90 additional levels with desert, jungle, cave, water, ice, lava, sky, factory and castle mechanics.
5. Add remaining achievements, localization, accessibility and store policies; verify platform requirements before release.
6. Profile older devices, test interruptions/offline recovery, then prepare signed store builds.

## Code map

```text
App.tsx                   App shell, navigation, state, dialogs and results
src/components/Art.tsx    Original fox and world illustrations
src/components/Icon.tsx   Vector icon set
src/components/UI.tsx     Buttons, typography, progress and stars
src/screens/             Home, world map, game and meta screens
src/game/levels.ts        Ten base layouts and 100-level world plan
src/game/engine.ts        Pure deterministic timestep game logic
src/game/scoring.ts       Central scoring rules
src/services/progress.ts  Progress, rewards, gates and cloud interface
src/services/storage.ts   Device-only persistence adapter
src/theme.ts              Palette and fonts
tests/game.test.ts        Scoring, game and progression tests
```

## Checks

```bash
npm run typecheck
npm test
npm run build             # static web export to dist/
npx expo install --check
```

Ten behavioral tests cover scoring, the brief's worked example, collectibles, collision/jump physics, checkpoints, boss/flag completion, damage, rewards, refills, unlocks and a full level-one input replay. Also perform a web smoke check after UI changes.

### Dependency audit

At implementation time, npm audit reports 23 advisories (16 high, 7 moderate) in the Expo/React Native tooling tree, including braces, node-forge and uuid. The latest available braces and node-forge versions remain affected. Do not run npm audit fix --force: its proposed downgrades break the SDK version pairing. Recheck upstream fixes before distribution.

## Assets and licenses

Illustrations and icon paths are original artwork for this project. Font packages include their SIL Open Font License files; retain them with redistributed fonts. Expo template images in assets/ are unused.
