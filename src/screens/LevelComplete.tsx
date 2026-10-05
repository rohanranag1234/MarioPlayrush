import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Fox } from "../components/Art";
import { Button, Title, Body, Label, Stars, Currency } from "../components/UI";
import { colors as c, fonts as f } from "../theme";
import { Level } from "../game/levels";
import { resultOf } from "../game/engine";
export function LevelComplete({
  level,
  result,
  skin,
  newBest,
  onNext,
  onReplay,
  onMap,
}: {
  level: Level;
  result: ReturnType<typeof resultOf>;
  skin: string;
  newBest: boolean;
  onNext: () => void;
  onReplay: () => void;
  onMap: () => void;
}) {
  const { height } = useWindowDimensions();
  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Label>
            LEVEL {level.id} · {newBest ? "NEW BEST!" : "TRAIL CONQUERED"}
          </Label>
          <Title style={{ fontSize: height < 400 ? 23 : 28 }}>
            {level.id % 10 === 0
              ? "Dread guardian defeated!"
              : "Level complete!"}
          </Title>
        </View>
        <Currency amount={result.coins} />
      </View>
      <View style={s.columns}>
        <View style={s.score}>
          {height >= 360 && <Fox size={height < 430 ? 64 : 100} color={skin} />}
          <Stars count={result.stars} size={height < 400 ? 25 : 32} />
          <Title style={{ fontSize: height < 400 ? 30 : 40 }}>
            {result.score.toLocaleString()}
          </Title>
          <Label>POINTS · {result.time}s</Label>
        </View>
        <ScrollView
          style={s.breakdown}
          contentContainerStyle={{ gap: 5, padding: 12 }}
        >
          <Label>SCORE BREAKDOWN</Label>
          {Object.entries(result.breakdown)
            .filter(([, n]) => n > 0)
            .map(([key, value]) => (
              <View key={key} style={s.row}>
                <Body style={{ fontSize: 12 }}>
                  {
                    {
                      coins: "Coins & gems",
                      enemies: "Monster stomps",
                      tokens: "Star tokens",
                      powerUps: "Power-ups",
                      secrets: "Secrets",
                      checkpoints: "Checkpoint",
                      finish: "Flag bonus",
                      time: "Time bonus",
                      noDamage: "No damage",
                      boss: "Guardian",
                    }[key]
                  }
                </Body>
                <Text style={s.value}>+{value.toLocaleString()}</Text>
              </View>
            ))}
        </ScrollView>
      </View>
      <View style={s.buttons}>
        <Button style={{ flex: 1 }} icon="arrow" onPress={onNext}>
          {level.id === 100 ? "Adventure complete" : "Next level"}
        </Button>
        <Button secondary onPress={onReplay}>
          Replay
        </Button>
        <Button secondary onPress={onMap}>
          Map
        </Button>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    flex: 1,
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    backgroundColor: c.paper,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  columns: { flex: 1, minHeight: 0, flexDirection: "row", gap: 20 },
  score: { flex: 0.65, alignItems: "center", justifyContent: "center", gap: 5 },
  breakdown: { flex: 1, backgroundColor: "#EAF0E1", borderRadius: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  value: { fontFamily: f.extra, color: c.ink, fontSize: 12 },
  buttons: { flexDirection: "row", gap: 12 },
});
