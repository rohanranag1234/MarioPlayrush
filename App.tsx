import { localProgressService } from "./src/services/storage";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
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
  ProgressBar,
} from "./src/components/UI";
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
  totalStars,
  canPlay,
  refillLives,
  dailyStatus,
  SKINS,
  worldRequirement,
} from "./src/services/progress";
import { makeLevel, Level, WORLDS } from "./src/game/levels";
import { resultOf } from "./src/game/engine";
type Result = ReturnType<typeof resultOf>;
const navs = [
  ["Home", "home"],
  ["World map", "map"],
  ["Shop", "shop"],
  ["Leaderboard", "trophy"],
  ["Daily rewards", "gift"],
  ["Achievements", "medal"],
];
export default function App() {
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
  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
  const narrow = width < 650;
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
  const navItem = (name: string, icon: string) => {
    const selected = screen === name;
    return (
      <Pressable
        key={name}
        accessibilityRole="button"
        accessibilityLabel={name}
        accessibilityState={{ selected }}
        onPress={() => navigate(name)}
        style={({ hovered }: any) => [
          s.navItem,
          selected && s.activeNav,
          hovered && !selected && { backgroundColor: "#F4F6F0" },
          !desktop && { paddingVertical: 11, paddingHorizontal: 14 },
        ]}
      >
        <Icon name={icon} size={19} color={selected ? c.green : "#8A9384"} />
        <Text
          style={[
            s.navText,
            selected && { color: c.green, fontFamily: f.extra },
          ]}
        >
          {name}
        </Text>
        {name === "Daily rewards" && !dailyStatus(p).claimed && (
          <View style={s.alertDot} />
        )}
      </Pressable>
    );
  };
  if ((!loaded && !fontError) || !ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.paper,
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Fox size={130} />
        <ActivityIndicator color={c.green} />
        <Text>Loading your adventure…</Text>
      </View>
    );
  return (
    <SafeAreaView style={s.app}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, flexDirection: "row" }}>
        {desktop && (
          <View style={s.sidebar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rusty Run home"
              onPress={() => navigate("Home")}
              style={s.brand}
            >
              <Fox size={51} />
              <View>
                <Text style={s.brandTitle}>
                  rusty<Text style={{ color: c.orange }}>run</Text>
                  <Text style={{ fontSize: 13, color: c.green }}> 100</Text>
                </Text>
                <Text style={s.brandTag}>A LITTLE FOX. A BIG ADVENTURE.</Text>
              </View>
            </Pressable>
            <Label
              style={{
                marginLeft: 25,
                marginTop: 39,
                marginBottom: 14,
                fontSize: 9,
              }}
            >
              LET’S EXPLORE
            </Label>
            <View style={{ paddingHorizontal: 15, gap: 5 }}>
              {navs.map(([n, i]) => navItem(n, i))}
            </View>
            <View style={{ flex: 1, minHeight: 30 }} />
            <View style={s.sidebarNote}>
              <View style={s.noteLeaf}>
                <Icon name="leaf" color="#8BA36E" size={22} />
              </View>
              <Text style={s.noteTitle}>
                Big adventures.{"\n"}Little paw prints.
              </Text>
              <Text style={s.noteBody}>
                Take your time.{"\n"}Find your own kind of brave.
              </Text>
              <View style={{ marginTop: 13 }}>
                <ProgressBar value={Object.keys(p.levels).length / 100} />
              </View>
              <Text style={s.noteProgress}>
                {Object.keys(p.levels).length} of 100 levels explored
              </Text>
            </View>
            <View style={{ padding: 15, gap: 4 }}>
              {navItem("Settings", "settings")}
              <Pressable onPress={() => setHelp(true)} style={s.navItem}>
                <Icon name="help" size={19} color="#8A9384" />
                <Text style={s.navText}>How to play</Text>
                <Icon name="arrow" size={13} color="#A6AD9F" />
              </Pressable>
            </View>
            <View style={s.sidebarFooter}>
              <View style={s.dot} />
              <Text
                style={{ fontFamily: f.body, color: c.muted, fontSize: 10 }}
              >
                Your next adventure starts here.
              </Text>
            </View>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={[s.topbar, !desktop && { paddingHorizontal: 20 }]}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              {desktop ? (
                <>
                  <Icon
                    name={navs.find(([n]) => n === screen)?.[1] || "leaf"}
                    color="#7B8975"
                    size={16}
                  />
                  <Text style={s.breadcrumb}>
                    Adventure <Text style={{ color: "#C6CEC0" }}> / </Text>
                    <Text style={{ color: c.ink }}>
                      {screen === "Game" ? "The trail" : screen}
                    </Text>
                  </Text>
                </>
              ) : (
                <Pressable
                  onPress={() => navigate("Home")}
                  style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                >
                  <Fox size={35} />
                  <Text style={[s.brandTitle, { fontSize: 22 }]}>
                    rusty<Text style={{ color: c.orange }}>run</Text>
                  </Text>
                </Pressable>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: narrow ? 9 : 15,
              }}
            >
              <Pressable
                accessibilityLabel="Open shop"
                accessibilityRole="button"
                onPress={() => navigate("Shop")}
                style={s.counter}
              >
                <Coin size={19} />
                <Text style={s.counterText}>{p.coins.toLocaleString()}</Text>
                <View style={s.counterPlus}>
                  <Text style={{ color: "#988C61", fontSize: 12 }}>+</Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityLabel="Lives and refills"
                accessibilityRole="button"
                onPress={() =>
                  notify(
                    p.lives === 5
                      ? "Your five hearts are full. The first ten levels are always free to play!"
                      : `${p.lives} of 5 lives. One heart refills every 20 minutes. The first ten levels are free to play.`,
                  )
                }
                style={[s.counter, { backgroundColor: "#F9EEEE" }]}
              >
                <Icon name="heart" color="#D78180" fill="#D78180" size={17} />
                <Text style={s.counterText}>{p.lives}</Text>
                {!narrow && (
                  <Text
                    style={{
                      fontFamily: f.bold,
                      fontSize: 8,
                      color: "#AD9691",
                    }}
                  >
                    {p.lives === 5 ? "FULL" : "REFILLING"}
                  </Text>
                )}
              </Pressable>
              <View
                style={{
                  width: 1,
                  height: 25,
                  backgroundColor: c.border,
                  marginHorizontal: 3,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Your profile"
                onPress={() => navigate("Profile")}
                style={{ flexDirection: "row", alignItems: "center", gap: 11 }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 20,
                    backgroundColor: "#F1E8D8",
                    overflow: "hidden",
                    alignItems: "center",
                  }}
                >
                  <Fox size={38} color={skin} />
                </View>
                {desktop && (
                  <View>
                    <Text
                      style={{
                        fontFamily: f.extra,
                        fontSize: 11,
                        color: c.ink,
                      }}
                    >
                      {p.nickname}
                    </Text>
                    <Text
                      style={{
                        fontFamily: f.body,
                        fontSize: 9,
                        color: c.muted,
                        marginTop: 3,
                      }}
                    >
                      Curious paws club
                    </Text>
                  </View>
                )}
                <Icon name="chevron" size={12} color="#99A091" />
              </Pressable>
            </View>
          </View>
          {!desktop && (
            <View
              style={{
                backgroundColor: "white",
                borderBottomWidth: 1,
                borderBottomColor: c.border,
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ padding: 8, gap: 5 }}
              >
                {navs.map(([n, i]) => navItem(n, i))}
                {navItem("Settings", "settings")}
                <Pressable onPress={() => setHelp(true)} style={s.navItem}>
                  <Icon name="help" />
                  <Text style={s.navText}>How to play</Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
          {saveError && (
            <View style={{ backgroundColor: "#FAE5CB", padding: 10 }}>
              <Text style={{ fontFamily: f.bold, color: "#795B35" }}>
                Progress is not saving. Check device storage or reset local data
                in Settings.
              </Text>
            </View>
          )}
          <ScrollView
            ref={scroll}
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: desktop ? 34 : narrow ? 18 : 28,
              paddingBottom: 32,
            }}
          >
            <View
              style={{ maxWidth: 1250, width: "100%", alignSelf: "center" }}
            >
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
              {screen === "Game" && level && (
                <Game
                  key={`${level.id}`}
                  level={level}
                  settings={p.settings}
                  skin={skin}
                  power={power}
                  onComplete={finish}
                  onQuit={() => {
                    setWorld(level.world.id);
                    navigate("World map");
                  }}
                  onRestart={spendLife}
                  onRetry={spendLife}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
      <Modal
        visible={Boolean(message || intro || result || help || reset)}
        animationType={p.settings.reducedMotion ? "none" : "fade"}
        transparent
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
                    Move with the left and right buttons. Tap the up arrow to
                    jump. On a keyboard, use A / D or arrow keys and Space.
                    {"\n\n"}Stomp creatures from above, collect coins, and find
                    all three star tokens. Reach the green flag before time runs
                    out.{"\n\n"}Earn 2 stars with two tokens OR the score
                    target. Earn 3 stars with all tokens AND the target.{"\n\n"}
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
                    target: {makeLevel(intro).target.toLocaleString()} points
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
                            {id === "boots" ? "Rocket boots" : "Star shield"} (
                            {p.inventory[id]})
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
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: c.paper },
  sidebar: {
    width: 220,
    backgroundColor: "#FDFEF9",
    borderRightWidth: 1,
    borderColor: c.border,
    paddingTop: 25,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 1,
  },
  brandTitle: {
    fontFamily: f.title,
    color: c.ink,
    fontSize: 24,
    letterSpacing: -0.7,
  },
  brandTag: {
    fontFamily: f.extra,
    fontSize: 5.8,
    letterSpacing: 1.05,
    color: "#9B9F8D",
    marginTop: 3,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 12,
  },
  activeNav: { backgroundColor: "#E9F0E2" },
  navText: { fontFamily: f.bold, fontSize: 12, color: "#788171" },
  alertDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: c.orange,
    marginLeft: "auto",
  },
  sidebarNote: {
    marginHorizontal: 20,
    padding: 18,
    backgroundColor: "#F1F4E9",
    borderWidth: 1,
    borderColor: "#E8ECD9",
    borderRadius: 12,
  },
  noteLeaf: { marginBottom: 12 },
  noteTitle: {
    fontFamily: f.title,
    fontSize: 20,
    color: "#71805E",
    lineHeight: 26,
  },
  noteBody: {
    fontFamily: f.body,
    color: "#9AA18C",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 9,
  },
  noteProgress: {
    fontFamily: f.body,
    fontSize: 9,
    color: "#9CA48F",
    marginTop: 7,
  },
  sidebarFooter: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: c.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
  },
  dot: { width: 4, height: 4, borderRadius: 3, backgroundColor: "#91A780" },
  topbar: {
    height: 77,
    backgroundColor: "#FDFEF9",
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    paddingHorizontal: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breadcrumb: { fontFamily: f.bold, fontSize: 11, color: "#8E9786" },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F7F2E4",
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 9,
  },
  counterText: { fontFamily: f.extra, fontSize: 12, color: "#615C41" },
  counterPlus: {
    width: 15,
    height: 15,
    borderRadius: 4,
    backgroundColor: "#EAE0C5",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
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
    padding: 30,
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
