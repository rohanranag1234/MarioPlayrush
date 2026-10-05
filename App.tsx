import { localProgressService } from "./src/services/storage";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  BackHandler,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Fredoka_600SemiBold } from "@expo-google-fonts/fredoka";
import {
  NunitoSans_400Regular,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
} from "@expo-google-fonts/nunito-sans";
import { colors as c, fonts as f } from "./src/theme";
import { Icon, Coin } from "./src/components/Icon";
import { Fox, Landscape } from "./src/components/Art";
import {
  Button,
  Title,
  Body,
  Label,
  Stars,
  Currency,
} from "./src/components/UI";
import { LaunchIntro } from "./src/components/LaunchIntro";
import { Home } from "./src/screens/Home";
import { WorldMap } from "./src/screens/WorldMap";
import { Game } from "./src/screens/Game";
import {
  Shop,
  Daily,
  Achievements,
  Leaderboard,
  Profile,
  SettingsScreen,
} from "./src/screens/Meta";
import {
  Progress,
  initialProgress,
  canPlay,
  refillLives,
  SKINS,
  worldRequirement,
} from "./src/services/progress";
import { makeLevel, Level } from "./src/game/levels";
import { resultOf } from "./src/game/engine";
type Result = ReturnType<typeof resultOf>;
const tabs = [
  ["Home", "home", "Home"],
  ["World map", "map", "Explore"],
  ["Shop", "shop", "Shop"],
  ["Profile", "user", "My fox"],
  ["More", "settings", "More"],
];
export default function App() {
  return (
    <SafeAreaProvider>
      <MobileApp />
    </SafeAreaProvider>
  );
}
function MobileApp() {
  const insets = useSafeAreaInsets();
  const safeAreaPadding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
  const [loaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });
  const [p, setP] = useState(initialProgress);
  const pRef = useRef(p);
  pRef.current = p;
  const [ready, setReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const appReady = Boolean(loaded || fontError) && ready;
  const storageFault = useRef(false);
  const [saveError, setSaveError] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const lastSaved = useRef("");
  const [screen, setScreen] = useState("Home");
  const [world, setWorld] = useState(1);
  const [level, setLevel] = useState<Level | null>(null);
  const [intro, setIntro] = useState<number | null>(null);
  const [power, setPower] = useState<string | undefined>();
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [reset, setReset] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [orientationError, setOrientationError] = useState(false);
  const orientationQueue = useRef(Promise.resolve());
  const inGame = screen === "Game" && level !== null;
  const landscape = inGame && !result;
  useEffect(() => {
    orientationQueue.current = orientationQueue.current
      .then(() =>
        ScreenOrientation.lockAsync(
          landscape
            ? ScreenOrientation.OrientationLock.LANDSCAPE
            : ScreenOrientation.OrientationLock.PORTRAIT_UP,
        ),
      )
      .then(() => setOrientationError(false))
      .catch(() => setOrientationError(true));
  }, [landscape]);
  const scroll = useRef<ScrollView>(null);
  const notify = (s: string) => setMessage(s);
  const update = (fn: (p: Progress) => Progress) => setP((prev) => fn(prev));
  useEffect(() => {
    localProgressService
      .load()
      .then((saved) => {
        lastSaved.current = JSON.stringify(saved);
        setP(refillLives(saved));
      })
      .catch(() => {
        storageFault.current = true;
        setSaveError(true);
        notify(
          "Your saved adventure could not be loaded. To avoid overwriting it, saving is paused. You can reset local progress in Settings to start fresh.",
        );
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready || storageFault.current) return;
    const data = JSON.stringify(p);
    if (data === lastSaved.current) return;
    saveQueue.current = saveQueue.current
      .then(() => localProgressService.save(p))
      .then(() => {
        lastSaved.current = data;
        setSaveError(false);
      })
      .catch(() => {
        setSaveError(true);
      });
  }, [p, ready]);
  useEffect(() => {
    const timer = setInterval(() => setP((prev) => refillLives(prev)), 30000);
    return () => clearInterval(timer);
  }, []);
  const navigate = (next: string) => {
    setScreen(next);
    setLevel(null);
    setResult(null);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  useEffect(() => {
    if (screen === "Game" || screen === "Home") return;
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      navigate("Home");
      return true;
    });
    return () => back.remove();
  }, [screen]);
  const openLevel = (id: number) => {
    if (!canPlay(pRef.current, id)) {
      const worldId = Math.ceil(id / 10);
      notify(
        `Finish the previous level${worldId > 1 ? ` and collect ${worldRequirement(worldId)} total stars` : ""} to unlock this trail. Replay earlier levels to find more star tokens.`,
      );
      return;
    }
    setPower(undefined);
    setIntro(id);
  };
  const spendLife = () => {
    const current = refillLives(pRef.current);
    if ((level?.id || intro || 1) <= 10) return true;
    if (current.lives <= 0) {
      notify(
        "Your hearts need a little rest. A life refills every 20 minutes, or you can pick one up in the shop.",
      );
      return false;
    }
    const next = {
      ...current,
      lives: current.lives - 1,
      lifeAt: current.lives === 5 ? Date.now() : current.lifeAt,
    };
    pRef.current = next;
    setP(next);
    return true;
  };
  const start = () => {
    if (!intro || !spendLife()) return;
    const id = intro;
    if (power)
      update((prev) => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [power]: Math.max(0, (prev.inventory[power] || 0) - 1),
        },
      }));
    update((prev) => ({
      ...prev,
      levels: prev.levels[id]
        ? {
            ...prev.levels,
            [id]: {
              ...prev.levels[id],
              attempts: prev.levels[id].attempts + 1,
            },
          }
        : prev.levels,
    }));
    setLevel(makeLevel(id));
    setIntro(null);
    setScreen("Game");
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const finish = (r: Result) => {
    if (!level) return;
    setNewBest(r.score > (pRef.current.levels[level.id]?.score || 0));
    update((prev) => {
      const best = prev.levels[level.id];
      return {
        ...prev,
        coins: prev.coins + r.coins,
        collectedCoins: prev.collectedCoins + r.coins,
        lives: Math.min(5, prev.lives + r.extraLives),
        highest: Math.max(prev.highest, Math.min(100, level.id + 1)),
        levels: {
          ...prev.levels,
          [level.id]: {
            score: Math.max(best?.score || 0, r.score),
            stars: Math.max(best?.stars || 0, r.stars),
            tokens: [...new Set([...(best?.tokens || []), ...r.tokens])],
            time: best ? Math.min(best.time, r.time) : r.time,
            attempts: best?.attempts || 1,
          },
        },
      };
    });
    setResult(r);
  };
  const meta = { p, update, notify };
  const skin = SKINS.find((s) => s.id === p.skin)?.color || "#E98346";
  const closeModal = () => {
    setMessage(null);
    setIntro(null);
    setHelp(false);
    setReset(false);
  };
  return (
    <View style={[s.app, safeAreaPadding]}>
      {appReady && (
        <View
          style={{ flex: 1 }}
          accessibilityElementsHidden={!introComplete}
          importantForAccessibility={
            introComplete ? "auto" : "no-hide-descendants"
          }
        >
          <StatusBar style="dark" hidden={landscape} />
          {inGame ? (
            <View style={{ flex: 1 }}>
              {orientationError && (
                <Text style={s.notice}>
                  Turn your phone sideways for the best view.
                </Text>
              )}
              <Game
                key={level.id}
                level={level}
                skin={skin}
                settings={p.settings}
                power={power}
                onComplete={finish}
                onRestart={spendLife}
                onRetry={spendLife}
                onQuit={() => {
                  setWorld(level.world.id);
                  navigate("World map");
                }}
              />
            </View>
          ) : (
            <>
              <View style={s.topbar}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Run for Life home"
                  onPress={() => navigate("Home")}
                  style={s.brand}
                >
                  <Fox size={37} />
                  <Text
                    style={s.brandTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    Run for <Text style={{ color: c.orange }}>Life</Text>
                  </Text>
                </Pressable>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${p.coins} coins. Open shop`}
                    onPress={() => navigate("Shop")}
                    style={s.counter}
                  >
                    <Coin size={18} />
                    <Text style={s.counterText}>
                      {p.coins.toLocaleString()}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${p.lives} lives. Refill information`}
                    style={[s.counter, { backgroundColor: "#F9EEEE" }]}
                    onPress={() =>
                      notify(
                        `${p.lives} of 5 lives. One life refills every 20 minutes. The first ten levels are free to play.`,
                      )
                    }
                  >
                    <Icon
                      name="heart"
                      color="#D78180"
                      fill="#D78180"
                      size={17}
                    />
                    <Text style={s.counterText}>{p.lives}</Text>
                  </Pressable>
                </View>
              </View>
              {saveError && (
                <Text style={s.notice}>
                  Progress is not saving. Check device storage or reset local
                  data in Settings.
                </Text>
              )}
              <ScrollView ref={scroll} contentContainerStyle={s.content}>
                {screen === "Home" && (
                  <Home
                    progress={p}
                    navigate={navigate}
                    onPlay={() => openLevel(p.highest)}
                    onWorld={(id) => {
                      setWorld(id);
                      navigate("World map");
                    }}
                    onDaily={() => navigate("Daily rewards")}
                  />
                )}
                {screen === "World map" && (
                  <WorldMap
                    progress={p}
                    world={world}
                    setWorld={setWorld}
                    onLevel={openLevel}
                  />
                )}
                {screen === "Shop" && <Shop {...meta} />}
                {screen === "Daily rewards" && <Daily {...meta} />}
                {screen === "Achievements" && <Achievements {...meta} />}
                {screen === "Leaderboard" && <Leaderboard {...meta} />}
                {screen === "Profile" && <Profile {...meta} />}
                {screen === "Settings" && (
                  <SettingsScreen {...meta} onReset={() => setReset(true)} />
                )}
                {screen === "More" && (
                  <View style={{ gap: 18 }}>
                    <Label>YOUR ADVENTURE KIT</Label>
                    <Title>A little more to explore</Title>
                    {[
                      ["Daily rewards", "gift"],
                      ["Leaderboard", "trophy"],
                      ["Achievements", "medal"],
                      ["Settings", "settings"],
                      ["How to play", "help"],
                    ].map(([name, icon]) => (
                      <Pressable
                        key={name}
                        accessibilityRole="button"
                        onPress={() =>
                          name === "How to play"
                            ? setHelp(true)
                            : navigate(name)
                        }
                        style={s.menuRow}
                      >
                        <Icon name={icon} color={c.green} />
                        <Text style={s.menuText}>{name}</Text>
                        <Icon name="chevron" size={17} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </ScrollView>
              <View style={s.tabbar} accessibilityRole="tablist">
                {tabs.map(([name, icon, label]) => {
                  const selected =
                    screen === name ||
                    (name === "More" &&
                      [
                        "Daily rewards",
                        "Leaderboard",
                        "Achievements",
                        "Settings",
                      ].includes(screen));
                  return (
                    <Pressable
                      key={name}
                      accessibilityRole="tab"
                      accessibilityLabel={label}
                      accessibilityState={{ selected }}
                      onPress={() => navigate(name)}
                      style={({ pressed }) => [
                        s.tab,
                        pressed && { opacity: 0.6 },
                      ]}
                    >
                      <View
                        style={[
                          s.tabIcon,
                          selected && { backgroundColor: c.mint },
                        ]}
                      >
                        <Icon
                          name={icon}
                          color={selected ? c.green : c.muted}
                          size={22}
                        />
                      </View>
                      <Text
                        style={[
                          s.tabLabel,
                          { color: selected ? c.green : c.muted },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
          <Modal
            visible={
              introComplete &&
              Boolean(message || intro || result || help || reset)
            }
            animationType={p.settings.reducedMotion ? "none" : "fade"}
            transparent
            supportedOrientations={[
              "portrait",
              "landscape-left",
              "landscape-right",
            ]}
            onRequestClose={() => {
              if (result) {
                setResult(null);
                navigate("World map");
              } else closeModal();
            }}
          >
            <View style={s.modalBackdrop}>
              <ScrollView
                style={{ maxHeight: "92%", width: "100%", maxWidth: 500 }}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View style={s.modalCard}>
                  {!result && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Close dialog"
                      onPress={closeModal}
                      style={{
                        position: "absolute",
                        top: 17,
                        right: 17,
                        zIndex: 2,
                        padding: 6,
                      }}
                    >
                      <Icon name="close" size={19} color={c.muted} />
                    </Pressable>
                  )}
                  {message ? (
                    <>
                      <View style={s.modalIcon}>
                        <Icon name="leaf" size={30} color={c.green} />
                      </View>
                      <Title style={{ textAlign: "center" }}>
                        A note from the trail
                      </Title>
                      <Body style={{ textAlign: "center" }}>{message}</Body>
                      <Button onPress={() => setMessage(null)}>Got it</Button>
                    </>
                  ) : reset ? (
                    <>
                      <Icon name="leaf" size={38} color={c.orange} />
                      <Title>Start a fresh adventure?</Title>
                      <Body style={{ textAlign: "center" }}>
                        This deletes your local scores, coins, inventory and
                        nickname. It cannot be undone.
                      </Body>
                      <Button
                        onPress={async () => {
                          await saveQueue.current;
                          try {
                            await localProgressService.delete();
                            storageFault.current = false;
                            lastSaved.current = "";
                            setP(initialProgress());
                            setSaveError(false);
                            setReset(false);
                            navigate("Home");
                          } catch {
                            notify(
                              "Could not delete your local data. Please try again.",
                            );
                          }
                        }}
                      >
                        Delete and start fresh
                      </Button>
                      <Button secondary onPress={() => setReset(false)}>
                        Keep my adventure
                      </Button>
                    </>
                  ) : help ? (
                    <>
                      <Fox size={100} />
                      <Title>A few tips for curious paws</Title>
                      <Body style={{ textAlign: "center" }}>
                        Move with the left and right buttons. Tap the up arrow
                        to jump. Hold a direction while tapping jump. Gameplay
                        turns sideways to give your thumbs more room.
                        {"\n\n"}Stomp creatures from above, collect coins, and
                        find all three star tokens. Reach the green flag before
                        time runs out.{"\n\n"}Earn 2 stars with two tokens OR
                        the score target. Earn 3 stars with all tokens AND the
                        target.{"\n\n"}
                        The first ten levels are free to retry. After that, each
                        start or retry uses a life.
                      </Body>
                      <Button onPress={() => setHelp(false)}>
                        Ready for adventure
                      </Button>
                    </>
                  ) : intro ? (
                    <>
                      <View
                        style={{
                          height: 160,
                          width: "100%",
                          overflow: "hidden",
                          borderRadius: 14,
                        }}
                      >
                        <Landscape world={Math.ceil(intro / 10)} hero />
                      </View>
                      <Label>
                        WORLD {Math.ceil(intro / 10)} · LEVEL {intro}
                      </Label>
                      <Title style={{ textAlign: "center" }}>
                        {makeLevel(intro).name}
                      </Title>
                      <Stars count={p.levels[intro]?.stars || 0} size={27} />
                      <Body style={{ textAlign: "center" }}>
                        Find three star tokens and reach the flag.{"\n"}Score
                        target: {makeLevel(intro).target.toLocaleString()}{" "}
                        points
                        {p.levels[intro]
                          ? `\nPersonal best: ${p.levels[intro].score.toLocaleString()}`
                          : ""}
                      </Body>
                      {(p.inventory.boots > 0 || p.inventory.shield > 0) && (
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          {["boots", "shield"]
                            .filter((id) => p.inventory[id] > 0)
                            .map((id) => (
                              <Button
                                key={id}
                                secondary={power !== id}
                                onPress={() =>
                                  setPower(power === id ? undefined : id)
                                }
                              >
                                {id === "boots"
                                  ? "Rocket boots"
                                  : "Star shield"}{" "}
                                ({p.inventory[id]})
                              </Button>
                            ))}
                        </View>
                      )}
                      <Button icon="play" onPress={start}>
                        Start adventure
                      </Button>
                      <Label>
                        {intro <= 10
                          ? "FREE PLAY · NO HEARTS NEEDED"
                          : "ONE HEART · A WHOLE NEW ADVENTURE"}
                      </Label>
                    </>
                  ) : result && level ? (
                    <>
                      <Fox size={100} color={skin} />
                      <Label>
                        {level.id % 10 === 0
                          ? "WORLD COMPLETE!"
                          : newBest
                            ? "A NEW PERSONAL BEST!"
                            : "A LITTLE MORE BRAVE"}
                      </Label>
                      <Title>
                        {level.id % 10 === 0
                          ? "Guardian defeated!"
                          : "You did it, little fox!"}
                      </Title>
                      <Stars count={result.stars} size={34} />
                      <Title style={{ fontSize: 43 }}>
                        {result.score.toLocaleString()}{" "}
                        <Text style={{ fontSize: 15 }}>PTS</Text>
                      </Title>
                      <View
                        style={{
                          width: "100%",
                          gap: 8,
                          padding: 18,
                          backgroundColor: "#F4F6EF",
                          borderRadius: 12,
                        }}
                      >
                        {Object.entries(result.breakdown)
                          .filter(([, n]) => n > 0)
                          .map(([k, n]) => (
                            <View
                              key={k}
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <Body style={{ fontSize: 12 }}>
                                {
                                  {
                                    coins: "Coins & gems",
                                    enemies: "Woodland stomps",
                                    tokens: "Star tokens",
                                    powerUps: "Power-ups",
                                    secrets: "Secret discoveries",
                                    checkpoints: "Checkpoint",
                                    finish: "Flag & height bonus",
                                    time: "Time bonus",
                                    noDamage: "No-damage bonus",
                                    boss: "Guardian defeated",
                                  }[k]
                                }
                              </Body>
                              <Text
                                style={{
                                  fontFamily: f.extra,
                                  color: c.ink,
                                  fontSize: 12,
                                }}
                              >
                                +{n.toLocaleString()}
                              </Text>
                            </View>
                          ))}
                      </View>
                      <Currency amount={result.coins} />
                      <Button
                        icon="arrow"
                        onPress={() => {
                          const next = level.id + 1;
                          setResult(null);
                          setWorld(Math.min(10, Math.ceil(next / 10)));
                          navigate("World map");
                          if (next <= 100) openLevel(next);
                        }}
                      >
                        {level.id === 100
                          ? "Adventure complete!"
                          : "Next adventure"}
                      </Button>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <Button
                          secondary
                          onPress={() => {
                            setResult(null);
                            setLevel(null);
                            setScreen("World map");
                            openLevel(level.id);
                          }}
                        >
                          Play again
                        </Button>
                        <Button
                          secondary
                          onPress={() => {
                            setResult(null);
                            navigate("World map");
                          }}
                        >
                          World map
                        </Button>
                      </View>
                    </>
                  ) : null}
                </View>
              </ScrollView>
            </View>
          </Modal>
        </View>
      )}
      {!introComplete && (
        <LaunchIntro
          ready={appReady}
          fontsReady={loaded}
          reducedMotion={p.settings.reducedMotion}
          onFinish={() => setIntroComplete(true)}
        />
      )}
    </View>
  );
}
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: c.paper },
  topbar: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#FDFEF9",
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  brand: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
  brandTitle: {
    fontFamily: f.title,
    color: c.ink,
    fontSize: 21,
    flexShrink: 1,
    letterSpacing: -0.6,
  },
  counter: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F7F2E4",
    borderRadius: 12,
  },
  counterText: { fontFamily: f.extra, color: c.ink, fontSize: 12 },
  content: {
    padding: 18,
    paddingBottom: 28,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  tabbar: {
    flexDirection: "row",
    backgroundColor: "#FDFEF9",
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 6,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
    gap: 3,
  },
  tabIcon: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 14 },
  tabLabel: { fontFamily: f.bold, fontSize: 10 },
  menuRow: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    minHeight: 64,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuText: { flex: 1, fontFamily: f.bold, fontSize: 15, color: c.ink },
  notice: {
    padding: 10,
    backgroundColor: "#FAE5CB",
    fontFamily: f.bold,
    color: "#795B35",
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#152F2ACC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: c.paper,
    borderRadius: 22,
    padding: 25,
    gap: 19,
    alignItems: "center",
  },
  modalIcon: {
    padding: 18,
    backgroundColor: c.mint,
    borderRadius: 40,
    marginTop: 8,
  },
});
