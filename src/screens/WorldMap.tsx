import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { WORLDS } from "../game/levels";
import {
  Progress,
  totalStars,
  worldRequirement,
  canPlay,
} from "../services/progress";
import { colors as c, fonts as f } from "../theme";
import { Title, Body, Label, Stars } from "../components/UI";
import { Icon } from "../components/Icon";
import { Landscape } from "../components/Art";
export function WorldMap({
  progress: p,
  world,
  setWorld,
  onLevel,
}: {
  progress: Progress;
  world: number;
  setWorld: (n: number) => void;
  onLevel: (n: number) => void;
}) {
  const w = WORLDS[world - 1];
  const stars = totalStars(p);
  const { width } = useWindowDimensions();
  return (
    <View style={{ gap: 24 }}>
      <View>
        <Label>FOLLOW YOUR CURIOSITY</Label>
        <Title style={{ fontSize: 34, marginTop: 7 }}>
          The adventure atlas
        </Title>
        <Body>
          100 little adventures, one big journey. Where will your paws take you?
        </Body>
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {WORLDS.map((w) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`World ${w.id}: ${w.name}`}
            key={w.id}
            onPress={() => setWorld(w.id)}
            style={[
              s.tab,
              world === w.id && {
                backgroundColor: c.green,
                borderColor: c.green,
              },
            ]}
          >
            <Icon
              name={w.icon}
              size={16}
              color={world === w.id ? "white" : c.muted}
            />
            <Text
              style={{
                fontFamily: f.extra,
                color: world === w.id ? "white" : c.muted,
                fontSize: 12,
              }}
            >
              {String(w.id).padStart(2, "0")}
            </Text>
          </Pressable>
        ))}
      </View>
      <View
        style={{
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: "white",
        }}
      >
        <View style={{ height: 210 }}>
          <Landscape world={world} />
          <View
            style={{
              position: "absolute",
              left: 28,
              top: 25,
              backgroundColor: "#FFFFFFDB",
              padding: 19,
              borderRadius: 12,
              maxWidth: "85%",
            }}
          >
            <Label>
              WORLD {String(world).padStart(2, "0")} · LEVELS{" "}
              {(world - 1) * 10 + 1}–{world * 10}
            </Label>
            <Title style={{ fontSize: 29, marginTop: 6 }}>{w.name}</Title>
            <Body>{w.subtitle}</Body>
          </View>
        </View>
        <View style={{ padding: width < 600 ? 20 : 36, gap: 28 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 15,
            }}
          >
            <Body style={{ color: c.green, fontFamily: f.bold }}>
              {world === 1
                ? "A fresh start. A hundred possibilities."
                : `${worldRequirement(world)} total stars + previous world required`}
            </Body>
            <Text style={{ fontFamily: f.extra, color: "#B69B51" }}>
              ★ {stars} stars
            </Text>
          </View>
          <View style={s.nodes}>
            {Array.from({ length: 10 }, (_, i) => {
              const id = (world - 1) * 10 + i + 1;
              const unlocked = canPlay(p, id);
              const best = p.levels[id];
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={`Level ${id}${unlocked ? "" : " locked"}`}
                  onPress={() => onLevel(id)}
                  style={{
                    width: width < 600 ? "28%" : "17%",
                    alignItems: "center",
                    gap: 10,
                    marginVertical: 8,
                  }}
                >
                  <View
                    style={[
                      s.node,
                      unlocked && {
                        backgroundColor: best ? "#EDF3E5" : c.green,
                        borderColor: best ? "#CDDEC2" : "#1A5035",
                      },
                      id % 10 === 0 && { borderRadius: 18 },
                    ]}
                  >
                    {!unlocked ? (
                      <Icon name="lock" color="#B5BDAE" size={23} />
                    ) : id % 10 === 0 ? (
                      <Icon
                        name="crown"
                        size={29}
                        color={best ? c.green : "white"}
                      />
                    ) : (
                      <Text
                        style={{
                          fontFamily: f.title,
                          fontSize: 25,
                          color: best ? c.green : "white",
                        }}
                      >
                        {id}
                      </Text>
                    )}
                  </View>
                  <Stars count={best?.stars || 0} size={13} />
                  <Text
                    style={{ fontFamily: f.bold, fontSize: 10, color: c.muted }}
                  >
                    {id % 10 === 0 ? "BOSS LEVEL" : `LEVEL ${id}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      {world > 1 && (
        <Body style={{ fontSize: 12 }}>
          Every course changes the terrain and treasure. Later levels bring wider
          gaps, faster monsters and more spikes.
        </Body>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  tab: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "white",
  },
  nodes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    rowGap: 22,
  },
  node: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#F0F2EC",
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: "#E2E6DB",
    alignItems: "center",
    justifyContent: "center",
  },
});
