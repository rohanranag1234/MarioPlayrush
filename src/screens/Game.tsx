import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  BackHandler,
  ScrollView,
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
import { TouchControl } from "../components/TouchControl";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Monster } from "../components/Monster";
import { LevelBackdrop } from "../components/LevelBackdrop";
import { FoxShape } from "../components/Art";
import { Icon, Coin } from "../components/Icon";
import { Button, Title, Body } from "../components/UI";
import { colors as c, fonts as f } from "../theme";
import { Level } from "../game/levels";
import {
  createGame,
  stepGame,
  retryGame,
  resultOf,
  Input,
} from "../game/engine";
import { totalScore } from "../game/scoring";
import { useGameplayMusic } from "../hooks/useGameplayMusic";
import { useButtonFeedback } from "../components/Feedback";
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
  const feedback = useButtonFeedback();
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  useGameplayMusic(settings.music && !paused && game.status === "playing");
  const input = useRef<Input>({ left: false, right: false, jump: false });
  const done = useRef(false);
  const jumpQueued = useRef(false);
  const insets = useSafeAreaInsets();
  const windowSize = useWindowDimensions();
  const [stage, setStage] = useState({
    width: windowSize.width,
    height: windowSize.height,
  });
  const viewWidth = Math.max(
    440,
    Math.min(1600, (440 * stage.width) / Math.max(1, stage.height)),
  );
  const camera = Math.max(
    0,
    Math.min(level.width - viewWidth, game.x - viewWidth / 3),
  );
  const togglePause = (v: boolean) => {
    pauseRef.current = v;
    jumpQueued.current = false;
    setPaused(v);
    input.current = { left: false, right: false, jump: false };
  };
  useEffect(() => {
    let frame: number;
    let last = 0;
    const tick = (time: number) => {
      if (last && !pauseRef.current) {
        let remaining = Math.min(0.1, (time - last) / 1000);
        let next = current.current;
        let first = true;
        while (remaining > 0) {
          const delta = Math.min(1 / 60, remaining);
          next = stepGame(
            next,
            level,
            { ...input.current, jumpPressed: first && jumpQueued.current },
            delta,
          );
          remaining -= delta;
          first = false;
        }
        jumpQueued.current = false;
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
    const blur = AppState.addEventListener("blur", () => togglePause(true));
    return () => {
      blur.remove();
      cancelAnimationFrame(frame);
      sub.remove();
    };
  }, [level]);
  useEffect(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      togglePause(true);
      return true;
    });
    return () => back.remove();
  }, []);
  const press = (key: keyof Input, value: boolean) => {
    if (key === "jump" && value && !input.current.jump)
      jumpQueued.current = true;
    input.current[key] = value;
  };
  const reset = (checkpoint: boolean) => {
    if (checkpoint && current.current.time <= 0) return;
    if (!(checkpoint ? onRetry() : onRestart())) return;
    const next = checkpoint
      ? retryGame(current.current, level)
      : createGame(level, power);
    current.current = next;
    setGame(next);
    done.current = false;
    togglePause(false);
  };
  const control = (key: keyof Input, icon: string, label: string) => (
    <TouchControl
      icon={icon}
      label={label}
      large={settings.largeControls}
      onChange={(held) => press(key, held)}
    />
  );
  return (
    <View
      style={s.stage}
      onLayout={({ nativeEvent: { layout } }) =>
        setStage({ width: layout.width, height: layout.height })
      }
    >
      <View style={StyleSheet.absoluteFill}>
        <LevelBackdrop world={level.world} variant={level.scenery} />
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
          {level.hazards.map((hazard, i) => (
            <G
              key={`hazard-${i}`}
              transform={`translate(${hazard.x} ${hazard.y})`}
            >
              <Rect y={17} width={hazard.w} height={5} fill="#765B53" />
              {Array.from({ length: Math.ceil(hazard.w / 14) }, (_, j) => (
                <Path
                  key={j}
                  d={`M${j * 14} 20l7-20 7 20z`}
                  fill="#654C64"
                  stroke="#F3CAB6"
                  strokeWidth={1.2}
                />
              ))}
            </G>
          ))}
          {game.enemies.map(
            (enemy, i) =>
              enemy.hp > 0 && (
                <G
                  key={i}
                  transform={`translate(${enemy.x} ${level.enemies[i].y})`}
                >
                  <Monster
                    kind={level.enemies[i].kind}
                    size={level.enemies[i].size}
                    hp={enemy.hp}
                    maxHp={level.enemies[i].health}
                    facing={enemy.dir}
                  />
                </G>
              ),
          )}
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
        style={[
          s.hud,
          {
            left: insets.left + 12,
            right: insets.right + 12,
            top: insets.top + 8,
          },
        ]}
      >
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
            onPressIn={feedback}
            onPress={() => togglePause(true)}
            style={{
              minWidth: 44,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="pause" />
          </Pressable>
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          left: insets.left + 15,
          top: insets.top + 70,
          flexDirection: "row",
          gap: 7,
        }}
      >
        <Text style={[s.hudText, { marginRight: 8 }]}>LEVEL {level.id}</Text>
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
      <View
        pointerEvents="box-none"
        style={[
          s.controls,
          {
            left: insets.left + 18,
            right: insets.right + 18,
            bottom: Math.max(12, insets.bottom + 6),
          },
          settings.leftHanded && { flexDirection: "row-reverse" },
        ]}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          {control("left", "back", "Hold to move left")}
          {control("right", "chevron", "Hold to move right")}
        </View>
        {control("jump", "jump", "Tap to jump")}
      </View>
      <View pointerEvents="none" style={s.powerUps}>
        {game.boots > 0 && (
          <Text style={s.powerText}>Boots {Math.ceil(game.boots)}s</Text>
        )}
        {game.shield > 0 && (
          <Text style={s.powerText}>Shield {Math.ceil(game.shield)}s</Text>
        )}
        {game.magnet > 0 && (
          <Text style={s.powerText}>Magnet {Math.ceil(game.magnet)}s</Text>
        )}
      </View>
      {(paused || game.status === "dead") && (
        <View style={s.overlay}>
          <ScrollView
            style={{ maxHeight: "94%", width: "94%", maxWidth: 520 }}
            contentContainerStyle={s.pauseCard}
          >
            <Title>
              {game.status === "dead"
                ? "Another little leap?"
                : "Take a breather."}
            </Title>
            <Body style={{ textAlign: "center" }}>
              {game.status === "dead"
                ? game.time <= 0
                  ? "Time is up. Restart for a fresh run."
                  : game.checkpoint
                    ? "Your checkpoint is ready. Let’s try again."
                    : "Every great adventure takes a little practice."
                : `Level ${level.id} · ${level.name}`}
            </Body>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Button
                icon="play"
                disabled={game.status === "dead" && game.time <= 0}
                onPress={() =>
                  game.status === "dead" ? reset(true) : togglePause(false)
                }
              >
                {game.status === "dead" ? "Try again" : "Keep exploring"}
              </Button>
              <Button secondary onPress={() => reset(false)}>
                Restart
              </Button>
            </View>
            <Button secondary icon="map" onPress={onQuit}>
              Back to world map
            </Button>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  stage: { flex: 1, backgroundColor: "#DCEEDC", overflow: "hidden" },
  hud: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#FDFEF0E8",
    gap: 12,
  },
  hudGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  hudText: { fontFamily: f.extra, color: c.ink, fontSize: 13 },
  score: { fontFamily: f.title, fontSize: 23, color: c.ink, letterSpacing: 2 },
  controls: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  powerUps: { position: "absolute", top: 72, right: 16, gap: 4 },
  powerText: {
    fontFamily: f.bold,
    color: c.ink,
    backgroundColor: "#FDFEF0CC",
    borderRadius: 8,
    padding: 5,
    fontSize: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#1C342DAA",
    justifyContent: "center",
    alignItems: "center",
  },
  pauseCard: {
    backgroundColor: c.paper,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    gap: 14,
  },
});
