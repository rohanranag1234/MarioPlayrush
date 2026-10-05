# Run for Life — Android & iOS

A mobile game written in **React Native + Expo + TypeScript**. This project targets Android phones and iPhones only. It has no web target, desktop layout, browser dependencies or keyboard controls.

## 1. Download and install

Unzip the source archive, open a terminal in the `run-for-life` folder, and run:

```bash
npm ci
```

Use Node.js 24 LTS. The project was checked with Node 24.14.1 and npm 11.11.0.

## 2. Run on your phone with Expo

```bash
npm start
```

1. Install an **Expo Go version compatible with Expo SDK 57** on your phone.
2. Keep the phone and your computer on the same Wi-Fi network.
3. On Android, scan the QR code from Expo Go. On iPhone, scan with the Camera app.
4. Tap **Let’s go!**, then **Start adventure**.

If your available Expo Go version cannot open SDK 57 projects, use the native build options below. Keep Expo and React Native versions paired as declared in `package.json`.

No backend credentials are needed for the guest game. Expo Go requires Metro to load the development bundle. An installed standalone build includes the game assets and can play locally without Metro.

### Updated safe-area code

`App.tsx` now uses a regular React Native `View` with padding from `useSafeAreaInsets()`. `SafeAreaProvider` remains at the root. Application source does not import or render `SafeAreaView`.

After replacing the source, stop the previous Metro process and restart from this project folder:

```bash
npm ci
npx expo start --clear
```

If a deprecation warning still appears, capture its full component stack to identify another local file or dependency using the deprecated React Native component. Warnings are not suppressed by this code.

## Animated app opening

On each fresh app launch, **Run for Life** shows an original fox intro with a gentle rise, scale animation, title reveal, and a fade into Home. The animation runs for **2.5 seconds** once bundled fonts and local progress are ready; slower loading holds the branded screen until ready. It runs once per app launch, not on every tab change or return from the background. System Reduce Motion and the saved reduced-motion preference use a simple fade instead of movement.

The native OS launch screen appears before React Native starts; the 2.5-second animation runs inside the app. The updated launcher name requires a new Android/iOS build and installation. Expo Go displays the project name, but its own installed launcher label remains Expo Go. Existing application identifiers and local progress keys are retained so this rename does not intentionally reset your save data.

## 3. Mobile controls and navigation

- **Portrait menus:** bottom tabs for Home, Explore, Shop, My fox and More.
- **More:** daily rewards, leaderboard status, achievements, settings and the touch-control guide.
- **Landscape gameplay:** starting a level requests landscape orientation and fills the available screen. Pause, results, replay and the next-level dialog stay in landscape. Returning to the map or menus requests portrait orientation. Android navigation and status bars are hidden during the run.
- **Two-thumb controls:** hold a direction with one thumb and tap jump with the other. Touch cancellation and backgrounding clear held inputs. Movement is about 27% faster; a 120ms jump buffer and 90ms ledge grace period make quick jump taps more forgiving.
- **Pause:** tap the pause button; Android Back also pauses the game. Returning from another app keeps the game paused.
- **Comfort:** larger buttons, a left-handed layout and reduced collectible motion are available in Settings.
- **Safe areas:** the scene fills the screen while the HUD and controls avoid notches and the home indicator.
- **Music and vibration:** an original 15-second loop plays during active gameplay and pauses with the game, on death, at completion and when backgrounded. Buttons give light haptic feedback. Toggle either option in Settings. Music respects iPhone silent mode; haptic strength/availability depends on the phone and system settings.

This update adds native audio, haptics and navigation-bar modules. Run `npm ci` and `npx expo start --clear` after replacing the source. Existing standalone/development builds must be rebuilt to include these modules.

## 4. Create an installable Android APK

The archive contains source code, not a signed APK. An EAS build creates the installable app. These remote builds need your Expo account and have not been run in this sandbox.

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

Use the APK download/install link from the completed build on your Android phone. Android may ask you to allow installation from the download source.

For Google Play, build an Android App Bundle instead:

```bash
npx eas-cli build --platform android --profile production
```

Before publishing, replace `com.rustyrun.adventure` with your own unique application identifier in `app.json` and configure signing through EAS.

## 5. Build for iPhone

For an internal build on registered iPhones:

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli device:create
npx eas-cli build --platform ios --profile preview
```

EAS will guide Apple Developer account, device registration and provisioning. A signed iPhone build needs Apple signing credentials; none are included in the project.

For TestFlight/App Store preparation:

```bash
npx eas-cli build --platform ios --profile production
```

For an iOS Simulator build on a Mac:

```bash
npx eas-cli build --platform ios --profile ios-simulator
```

The simulator build cannot be installed on a physical iPhone. You can also open an already configured simulator/emulator through `npm run ios` (Mac + Xcode) or `npm run android` (Android Studio).

## 6. What the game contains

| System       | Current implementation                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile shell | Portrait menus, bottom navigation, landscape game/results, safe areas, Android Back handling                                            |
| Platformer   | Movement, jumping, gravity, collision, pits, enemy stomps/chains, checkpoints, timer, spikes, flag and guardians with increasing health |
| Scoring      | Central action-point rules, 1–3 stars, best scores, time/no-damage bonuses, coins separate from points                                  |
| Courses      | 100 distinct seeded layouts, increasing length/gaps/enemy speed, three tokens per level, coins/gems and pickups                         |
| Progress     | 100 level nodes in 10 worlds, sequential/star gates, lives/refills and local persistence                                                |
| Meta game    | Skin and power-up shop, daily rewards, four achievements, profile and settings                                                          |
| Art/audio    | Original fox, changing scenery, horned/fanged monsters in SVG, original looping music, button haptics and bundled fonts                 |

The first ten levels are free to retry. Later starts and death retries cost a life; one life refills every 20 minutes up to five. Collected currency and extra lives bank on successful completion. Replays can earn coins; total points use each level's best score. Checkpoint retries preserve collectibles and mark the run damaged.

## 7. Work still needed for the full brief

This remains a playable **guest prototype**, not a completed store release:

- All 100 courses use deterministic procedural generation with distinct geometry. They are not 100 hand-authored levels. Later courses introduce spikes, pursuing hunters, tougher brutes and stronger guardians. Physical playtesting, score-target balancing and additional world-specific mechanics still need work.
- Google/Apple/email sign-in, cloud saves, account linking, shared leaderboards and server score validation are not connected. `CloudService` is the service boundary; leaderboard screens explain the connection status.
- Action sound effects, ads, notifications, real-money purchases, sharing, translations and full onboarding are not implemented.
- Backgrounding pauses the run in memory. Force-closing the app ends the current run; completed progress remains saved. Durable in-progress recovery is still needed.
- Before cloud launch: implement authentication, owned-data rules, idempotent rewards/results, rate limits, score replay/validation and max-progress conflict handling.
- Physical-phone touch behavior, audio, haptics, orientation, interruptions and frame-rate performance need real-device testing. Native JavaScript/Hermes exports do not prove these runtime behaviors.

## Source guide

```text
App.tsx                          Mobile shell, orientation, bottom tabs, state and dialogs
src/components/LaunchIntro.tsx    2.5-second animated opening
src/components/TouchControl.tsx   Per-touch movement/jump controls
src/components/Feedback.tsx       Button haptic feedback
src/components/Monster.tsx        Crawler, hunter, brute and guardian artwork
src/components/LevelBackdrop.tsx  World scenery with per-level variation
src/hooks/useGameplayMusic.ts     Native looping music lifecycle
assets/music/night-trail.wav      Original gameplay loop
scripts/generate-music.py         Reproducible music synthesis (Python stdlib)
src/screens/Game.tsx              Fullscreen scene, HUD, camera and pause
src/screens/LevelComplete.tsx     Landscape results with score breakdown
src/screens/Home.tsx              Phone home screen
src/screens/WorldMap.tsx          World and level selection
src/screens/Meta.tsx              Shop, rewards, achievements, profile and settings
src/game/engine.ts                Pure game simulation
src/game/scoring.ts               Points and star rules
src/game/levels.ts                Level layouts and world definitions
src/services/progress.ts          Progress, reward and cloud interfaces
src/services/storage.ts           AsyncStorage persistence
src/components/Art.tsx            Original vector artwork
app.json                         Android/iOS identifiers and orientation plugin
eas.json                        APK, iPhone, simulator and production profiles
```

## Validation

```bash
npm run typecheck
npm test
npx expo install --check
npm run build           # Android + iOS JavaScript/Hermes exports
```

`npm run build` checks native bundling; it does **not** generate an APK/IPA. Use the EAS commands above for signed installable apps.

All 18 tests pass, covering scoring, rewards/progression, checkpoint safety, short taps, jump buffering, ledge grace, enemy behavior, simultaneous touch input and a complete level-one replay. Tests verify 100 deterministic unique layouts and traverse their terrain with enemies/hazards removed to isolate jump reachability. This does not prove every combat encounter is balanced or that all 100 levels have been beaten. Android and iOS bundle exports and TypeScript pass; physical-device checks remain outstanding.

The dependency installation still reports 23 upstream advisories (16 high, 7 moderate) in the Expo/React Native tooling dependency tree. Do not apply the proposed incompatible SDK downgrades using `npm audit fix --force`. Recheck upstream fixes before release.

## Licenses

Illustrations, icon paths and the synthesized music loop are original source assets. Fredoka and Nunito Sans font packages include SIL Open Font License files; retain those licenses when redistributing font files. Template images in `assets/` are unused.
