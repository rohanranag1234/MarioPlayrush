import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  AppState,
  useWindowDimensions,
} from "react-native";
import Svg, {
  G,
  Rect,
  Circle,
  Path,
  Ellipse,
  Text as SvgText,
} from "react-native-svg";
import { Landscape, FoxShape } from "../components/Art";
import { Icon, Coin } from "../components/Icon";
import { Button, Title, Body } from "../components/UI";
import { colors as c, fonts as f } from "../theme";
import { Level } from "../game/levels";
import {
  createGame,
  stepGame,
  retryGame,
  resultOf,
  GameState,
  Input,
} from "../game/engine";
import { totalScore } from "../game/scoring";
import { Settings } from "../services/progress";
const starPath = "M0-12 4-4 12-3 6 3 8 11 0 7-8 11-6 3-12-3-4-4z";
export function Game({
  level,
  skin,
  settings,
  power,
  onComplete,
  onQuit,
  onRestart,
  onRetry,
}: {
  level: Level;
  skin: string;
  settings: Settings;
  power?: string;
  onComplete: (r: ReturnType<typeof resultOf>) => void;
  onQuit: () => void;
  onRestart: () => boolean;
  onRetry: () => boolean;
}) {
  const [game, setGame] = useState(() => createGame(level, power));
  const current = useRef(game);
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  const input = useRef<Input>({ left: false, right: false, jump: false });
  const done = useRef(false);
  const { width } = useWindowDimensions();
  const viewWidth = width < 700 ? 520 : 900;
  const camera = Math.max(
    0,
    Math.min(level.width - viewWidth, game.x - viewWidth / 3),
  );
  const togglePause = (v: boolean) => {
    pauseRef.current = v;
    setPaused(v);
    input.current = { left: false, right: false, jump: false };
  };
  useEffect(() => {
    let frame: number;
    let last = 0;
    const tick = (time: number) => {
      if (last && !pauseRef.current) {
        const next = stepGame(
          current.current,
          level,
          input.current,
          (time - last) / 1000,
        );
        current.current = next;
        setGame(next);
        if (next.status === "complete" && !done.current) {
          done.current = true;
          onComplete(resultOf(next, level));
        }
      }
      last = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") togglePause(true);
    });
    return () => {
      cancelAnimationFrame(frame);
      sub.remove();
    };
  }, [level]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const key = (e: KeyboardEvent, down: boolean) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w"].includes(
          e.key,
        )
      ) {
        e.preventDefault();
        if (e.key === "ArrowLeft" || e.key === "a") input.current.left = down;
        if (e.key === "ArrowRight" || e.key === "d") input.current.right = down;
        if (["ArrowUp", " ", "w"].includes(e.key)) input.current.jump = down;
      }
      if (e.key === "Escape" && down) togglePause(!pauseRef.current);
    };
    const kd = (e: KeyboardEvent) => key(e, true),
      ku = (e: KeyboardEvent) => key(e, false),
      blur = () => togglePause(true);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", blur);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", blur);
    };
  }, []);
  const press = (key: keyof Input, value: boolean) => {
    input.current[key] = value;
  };
  const reset = (checkpoint: boolean) => {
    if (!(checkpoint ? onRetry() : onRestart())) return;
    const next = checkpoint ? retryGame(current.current) : createGame(level);
    current.current = next;
    setGame(next);
    done.current = false;
    togglePause(false);
  };
  const control = (key: keyof Input, icon: string, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => press(key, true)}
      onPressOut={() => press(key, false)}
      style={({ pressed }) => [
        s.control,
        settings.largeControls && { width: 76, height: 66 },
        pressed && { backgroundColor: "#D2DFC9" },
      ]}
    >
      <Icon name={icon} size={27} color={c.green} />
    </Pressable>
  );
  return (
    <View style={{ gap: 18 }}>
      <View style={s.heading}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Title>{level.name}</Title>
          <Body>
            World {level.world.id} · Level {level.id} · Reach the flag and find
            all three star tokens.
          </Body>
        </View>
        <Button secondary icon="close" onPress={onQuit}>
          Exit
        </Button>
      </View>
      <View style={s.gameWrap}>
        <View style={s.hud}>
          <View style={s.hudGroup}>
            <Icon name="heart" color="#D87773" fill="#D87773" size={19} />
            <Text style={s.hudText}>{game.hearts}</Text>
            <Coin size={20} />
            <Text style={s.hudText}>{game.coins}</Text>
          </View>
          <Text style={s.score}>
            {String(totalScore(game.breakdown)).padStart(6, "0")}
          </Text>
          <View style={s.hudGroup}>
            <Icon name="clock" size={17} />
            <Text style={s.hudText}>{Math.ceil(game.time)}s</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pause game"
              onPress={() => togglePause(true)}
            >
              <Icon name="pause" />
            </Pressable>
          </View>
        </View>
        <View
          style={{
            aspectRatio: viewWidth / 440,
            minHeight: width < 700 ? 300 : undefined,
            width: "100%",
            overflow: "hidden",
            backgroundColor: level.world.sky,
          }}
        >
          <View style={StyleSheet.absoluteFill}>
            <Landscape world={level.world.id} />
          </View>
          <Svg
            style={StyleSheet.absoluteFill}
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewWidth} 440`}
          >
            <G transform={`translate(${-camera} 0)`}>
              {level.platforms.map((p, i) => (
                <G key={i}>
                  <Rect
                    x={p.x}
                    y={p.y}
                    width={p.w}
                    height={p.h}
                    rx={p.h < 30 ? 6 : 0}
                    fill={p.h < 30 ? "#B9976D" : "#C3AA7B"}
                  />
                  <Rect
                    x={p.x}
                    y={p.y}
                    width={p.w}
                    height={9}
                    rx={3}
                    fill={level.world.ground}
                  />
                  {Array.from({ length: Math.floor(p.w / 45) }, (_, j) => (
                    <Path
                      key={j}
                      d={`M${p.x + j * 45 + 15} ${p.y + 22}l6 3-4 4`}
                      fill="none"
                      stroke="#A7906655"
                      strokeWidth="3"
                    />
                  ))}
                </G>
              ))}
              {level.items
                .filter((it) => !game.collected.includes(it.id))
                .map((it) => (
                  <G
                    key={it.id}
                    transform={`translate(${it.x} ${it.y + (settings.reducedMotion ? 0 : Math.sin(game.tick * 3 + it.id) * 3)})`}
                  >
                    {it.kind === "coin" || it.kind === "bigCoin" ? (
                      <>
                        <Circle
                          r={it.kind === "bigCoin" ? 12 : 8}
                          fill="#EDBE4F"
                          stroke="#FFF0AD"
                          strokeWidth="2"
                        />
                        <Path d="M0-4V4" stroke="#FFF0AD" strokeWidth="2" />
                      </>
                    ) : it.kind === "token" ? (
                      <Path
                        d={starPath}
                        fill="#F0B947"
                        stroke="#FFF5C9"
                        strokeWidth="2"
                      />
                    ) : it.kind === "gem" ? (
                      <Path
                        d="m0-12 10 9L0 12-10-3z"
                        fill="#8F9DD6"
                        stroke="#E5E7FC"
                        strokeWidth="2"
                      />
                    ) : it.kind === "secret" ? (
                      <>
                        <Rect
                          x={-11}
                          y={-11}
                          width={22}
                          height={22}
                          rx={4}
                          fill="#C09258"
                        />
                        <SvgText
                          textAnchor="middle"
                          y={5}
                          fontWeight="bold"
                          fill="#FFF4D4"
                        >
                          ?
                        </SvgText>
                      </>
                    ) : (
                      <>
                        <Circle
                          r={13}
                          fill={it.kind === "berry" ? "#DA7F80" : "#709B87"}
                          stroke="#FFF4D4"
                          strokeWidth="2"
                        />
                        <SvgText
                          textAnchor="middle"
                          y={5}
                          fontSize={14}
                          fill="white"
                        >
                          {it.kind === "boots"
                            ? "↑"
                            : it.kind === "heart"
                              ? "♥"
                              : it.kind === "shield"
                                ? "S"
                                : it.kind === "magnet"
                                  ? "M"
                                  : "B"}
                        </SvgText>
                      </>
                    )}
                  </G>
                ))}
              <G transform={`translate(${level.checkpoint} 270)`}>
                <Rect width={5} height={90} fill="#816E53" />
                <Path
                  d="M5 0h45l-12 15 12 15H5z"
                  fill={game.checkpoint ? "#EABD4F" : "#90A081"}
                />
              </G>
              <G transform={`translate(${level.flag} 173)`}>
                <Rect width={6} height={187} rx={3} fill="#EDE8D6" />
                <Circle cx={3} cy={-3} r={7} fill="#E7B849" />
                <Path d="M6 4h64L54 26l16 22H6z" fill={c.green} />
                <Path
                  d="m25 24 8 7 17-16"
                  stroke="#FFF6D8"
                  strokeWidth={4}
                  fill="none"
                />
              </G>
              {game.enemies.map((e, i) => {
                const def = level.enemies[i];
                return (
                  e.hp > 0 && (
                    <G
                      key={i}
                      transform={`translate(${e.x} ${def.y}) scale(${def.boss ? 2 : 1})`}
                    >
                      <Ellipse cx={13} cy={24} rx={19} ry={5} fill="#50764D" />
                      <Path
                        d="M0 22V14C0-6 27-6 27 14v8z"
                        fill={def.boss ? "#967A9C" : "#8C7661"}
                      />
                      <Circle cx={8} cy={11} r={4} fill="#FFF4D6" />
                      <Circle cx={20} cy={11} r={4} fill="#FFF4D6" />
                      <Circle cx={9} cy={12} r={1.7} fill="#384E38" />
                      <Circle cx={21} cy={12} r={1.7} fill="#384E38" />
                      {def.boss && (
                        <>
                          <Path d="m0-3 3-9 8 6 7-6 5 9z" fill="#E6B844" />
                          <Rect
                            x={-3}
                            y={-20}
                            width={34}
                            height={4}
                            fill="#BFA7B8"
                          />
                          <Rect
                            x={-3}
                            y={-20}
                            width={(34 * e.hp) / 3}
                            height={4}
                            fill="#855C85"
                          />
                        </>
                      )}
                    </G>
                  )
                );
              })}
              <G
                opacity={
                  game.invincible > 0 && Math.floor(game.tick * 12) % 2 === 0
                    ? 0.4
                    : 1
                }
                transform={`translate(${game.x - 6} ${game.y - 5})`}
              >
                {game.shield > 0 && (
                  <Circle
                    cx={20}
                    cy={23}
                    r={32}
                    fill="#EFF6BC66"
                    stroke="#F7F1C0"
                    strokeWidth={2}
                  />
                )}
                <G
                  transform={
                    game.facing === 1
                      ? "scale(.24)"
                      : "translate(44 0) scale(-.24 .24)"
                  }
                >
                  <FoxShape color={skin} />
                </G>
              </G>
              {game.popTime > 0 && (
                <SvgText
                  x={game.x + 15}
                  y={game.y - 12 - (0.8 - game.popTime) * 25}
                  fill="#345B35"
                  stroke="#F7F9DD"
                  strokeWidth={0.3}
                  fontSize={19}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {game.pop}
                </SvgText>
              )}
            </G>
          </Svg>
          <View
            style={{
              position: "absolute",
              left: 15,
              top: 12,
              flexDirection: "row",
              gap: 7,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Icon
                key={i}
                name="star"
                size={20}
                color={i < game.tokens.length ? "#E1AA34" : "#FFFFFF99"}
                fill={i < game.tokens.length ? "#EAC052" : "#FFFFFF55"}
              />
            ))}
          </View>
          {(paused || game.status === "dead") && (
            <View style={s.overlay}>
              <View style={s.pauseCard}>
                <Icon
                  name={game.status === "dead" ? "heart" : "pause"}
                  size={34}
                  color={c.orange}
                />
                <Title>
                  {game.status === "dead"
                    ? "Another little leap?"
                    : "Take a breather."}
                </Title>
                <Body style={{ textAlign: "center" }}>
                  {game.status === "dead"
                    ? game.checkpoint
                      ? "Your checkpoint is ready. Let’s try again."
                      : "Every great adventure takes a little practice."
                    : "The meadow will be right here."}
                </Body>
                <Button
                  icon="play"
                  onPress={() =>
                    game.status === "dead" ? reset(true) : togglePause(false)
                  }
                >
                  {game.status === "dead" ? "Try again" : "Keep exploring"}
                </Button>
                <Button secondary onPress={() => reset(false)}>
                  Restart level
                </Button>
                <Pressable onPress={onQuit}>
                  <Body>Back to world map</Body>
                </Pressable>
              </View>
            </View>
          )}
        </View>
        <View
          style={[
            s.controls,
            settings.leftHanded && { flexDirection: "row-reverse" },
          ]}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            {control("left", "back", "Move left")}
            {control("right", "chevron", "Move right")}
          </View>
          {width > 700 && (
            <Body style={{ fontSize: 11, textAlign: "center" }}>
              ARROWS or A / D to move · SPACE to jump{"\n"}Jump on woodland
              creatures to bounce higher.
            </Body>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={s.hudText}>JUMP</Text>
            {control("jump", "jump", "Jump")}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
        <Body style={{ fontSize: 12 }}>★ Find 3 star tokens</Body>
        <Body style={{ fontSize: 12 }}>⚑ Checkpoint halfway</Body>
        <Body style={{ fontSize: 12 }}>
          Target: {level.target.toLocaleString()} points
        </Body>
        {game.boots > 0 && <Body>Rocket boots: {Math.ceil(game.boots)}s</Body>}
        {game.shield > 0 && <Body>Shield: {Math.ceil(game.shield)}s</Body>}
        {game.magnet > 0 && <Body>Magnet: {Math.ceil(game.magnet)}s</Body>}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  gameWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
    backgroundColor: "white",
  },
  hud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  hudGroup: { flexDirection: "row", alignItems: "center", gap: 11 },
  hudText: { fontFamily: f.extra, color: c.ink, fontSize: 13 },
  score: { fontFamily: f.title, fontSize: 23, color: c.ink, letterSpacing: 2 },
  controls: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  control: {
    backgroundColor: "#EFF3E8",
    borderRadius: 14,
    borderBottomWidth: 3,
    borderBottomColor: "#D8E0D0",
    height: 54,
    width: 62,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { touchAction: "none", userSelect: "none" } as any,
    }),
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1C342D88",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseCard: {
    backgroundColor: c.paper,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    gap: 12,
    width: 310,
    maxWidth: "95%",
    maxHeight: "100%",
  },
});
