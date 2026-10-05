import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors as c, fonts as f } from "../theme";
import { Landscape, Fox } from "../components/Art";
import { Icon, Coin } from "../components/Icon";
import { Body, Title, Label, Button, ProgressBar } from "../components/UI";
import {
  Progress,
  totalStars,
  totalPoints,
  dailyStatus,
  worldRequirement,
} from "../services/progress";
import { WORLDS } from "../game/levels";
export function Home({
  progress: p,
  navigate,
  onPlay,
  onWorld,
  onDaily,
}: {
  progress: Progress;
  navigate: (s: string) => void;
  onPlay: () => void;
  onWorld: (n: number) => void;
  onDaily: () => void;
}) {
  const compact = true;
  const stars = totalStars(p);
  const completed = Object.keys(p.levels).length;
  const daily = dailyStatus(p);
  return (
    <View style={{ gap: 29 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Label>YOUR NEXT ADVENTURE AWAITS</Label>
          <Title style={{ fontSize: compact ? 30 : 34, marginTop: 7 }}>
            Hey, {p.nickname === "Adventurer" ? "adventurer" : p.nickname}!{" "}
            <Text style={{ color: c.orange }}>Let’s play.</Text>
          </Title>
          <Body style={{ marginTop: 6 }}>
            A little courage. A few big jumps. A whole world to explore.
          </Body>
        </View>
        {!compact && (
          <View style={s.saveBadge}>
            <View style={s.dot} />
            <Text style={s.small}>Progress saved on this device</Text>
          </View>
        )}
      </View>
      <View style={[s.hero, compact && { height: 420 }]}>
        <View
          style={[
            s.heroArt,
            compact && { width: "100%", height: 255, top: 165, left: 0 },
          ]}
        >
          <Landscape hero />
        </View>
        <View style={[s.heroCopy, compact && { padding: 25, width: "100%" }]}>
          <View style={s.tag}>
            <View style={s.dot} />
            <Text style={s.tagText}>SMALL FOX. BIG ADVENTURE.</Text>
          </View>
          <Text
            style={[s.heroTitle, compact && { fontSize: 37, lineHeight: 42 }]}
          >
            The wild is{compact ? " " : "\n"}calling.
          </Text>
          <Body
            style={{
              color: "#647B60",
              maxWidth: 245,
              marginTop: 10,
              fontSize: 14,
            }}
          >
            Lace up, little fox. There’s a whole lot of wonder just beyond the
            meadow.
          </Body>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 18,
              marginTop: 23,
            }}
          >
            <Button onPress={onPlay} icon="play">
              Let’s go!
            </Button>
            <Text style={s.levelHint}>
              LEVEL {p.highest} <Text style={{ color: "#82917A" }}> / 100</Text>
            </Text>
          </View>
        </View>
        {!compact && (
          <View style={s.heroCaption}>
            <Icon name="leaf" size={13} color="#fff" />
            <Text
              style={{
                fontFamily: f.bold,
                color: "#fff",
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              GREEN MEADOWS
            </Text>
          </View>
        )}
      </View>
      <View style={[s.stats, compact && { flexWrap: "wrap" }]}>
        {[
          {
            icon: "flag",
            value: `${completed}`,
            of: "/ 100",
            label: "Levels completed",
            color: "#739574",
            bg: "#EFF4E9",
          },
          {
            icon: "star",
            value: `${stars}`,
            of: "/ 300",
            label: "Stars collected",
            color: "#D5A63E",
            bg: "#FBF4DF",
          },
          {
            icon: "trophy",
            value: totalPoints(p).toLocaleString(),
            of: "PTS",
            label: "Total adventure points",
            color: "#CF8D61",
            bg: "#FBEFE5",
          },
          {
            icon: "map",
            value: String(Math.ceil(p.highest / 10)).padStart(2, "0"),
            of: "/ 10",
            label: "Worlds discovered",
            color: "#8798B6",
            bg: "#EDF0F7",
          },
        ].map((stat, i) => (
          <View
            key={stat.label}
            style={[
              s.stat,
              compact && {
                flex: 0,
                flexBasis: "50%",
                flexGrow: 0,
                flexShrink: 0,
                paddingHorizontal: 16,
                marginVertical: 10,
              },
              i > 0 &&
                !compact && { borderLeftWidth: 1, borderLeftColor: c.border },
            ]}
          >
            <View style={[s.statIcon, { backgroundColor: stat.bg }]}>
              <Icon name={stat.icon} size={22} color={stat.color} />
            </View>
            <View>
              <View
                style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}
              >
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statOf}>{stat.of}</Text>
              </View>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>
      <View>
        <View style={[s.sectionHeader, compact && { flexWrap: "wrap" }]}>
          <View>
            <Title style={{ fontSize: 24 }}>A world of possibilities</Title>
            <Body style={{ fontSize: 12, marginTop: 3 }}>
              Ten worlds. One unforgettable adventure.
            </Body>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigate("World map")}
            style={s.textLink}
          >
            <Text style={s.link}>View world map</Text>
            <Icon name="arrow" size={16} color={c.green} />
          </Pressable>
        </View>
        <View style={[s.worlds, compact && { flexDirection: "column" }]}>
          {WORLDS.slice(0, 3).map((w) => {
            const unlocked =
              p.highest >= (w.id - 1) * 10 + 1 &&
              stars >= worldRequirement(w.id);
            const worldStars = Object.entries(p.levels)
              .filter(([id]) => Math.ceil(Number(id) / 10) === w.id)
              .reduce((sum, [, l]) => sum + l.stars, 0);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Explore ${w.name}`}
                key={w.id}
                onPress={() => onWorld(w.id)}
                style={({ hovered }: any) => [
                  s.worldCard,
                  hovered && { transform: [{ translateY: -3 }] },
                ]}
              >
                <View
                  style={{
                    height: 144,
                    overflow: "hidden",
                    backgroundColor: w.color,
                  }}
                >
                  <Landscape world={w.id} />
                  <View style={s.worldNumber}>
                    <Text style={s.worldNumberText}>
                      WORLD {String(w.id).padStart(2, "0")}
                    </Text>
                  </View>
                  {!unlocked && (
                    <View style={s.lockBadge}>
                      <Icon name="lock" size={14} color="#58684F" />
                    </View>
                  )}
                  {w.id === 1 && (
                    <View
                      style={{ position: "absolute", bottom: 6, left: "41%" }}
                    >
                      <Fox size={70} />
                    </View>
                  )}
                </View>
                <View style={{ padding: 18, gap: 11 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Title style={{ fontSize: 19 }}>{w.name}</Title>
                    <Icon
                      name={unlocked ? "arrow" : "lock"}
                      size={17}
                      color={unlocked ? c.green : "#A6ACA1"}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={s.cardDetail}>
                      Levels {(w.id - 1) * 10 + 1}–{w.id * 10}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon
                        name="star"
                        size={13}
                        fill={unlocked ? "#E4B049" : "#C6CBBD"}
                        color={unlocked ? "#E4B049" : "#C6CBBD"}
                      />
                      <Text style={s.cardDetail}>{worldStars} / 30</Text>
                    </View>
                  </View>
                  <ProgressBar value={worldStars / 30} />
                  <Text
                    style={[
                      s.cardDetail,
                      { fontSize: 10, color: unlocked ? c.green : c.muted },
                    ]}
                  >
                    {unlocked
                      ? "Your adventure starts here"
                      : `Finish World ${w.id - 1} + collect ${worldRequirement(w.id)} stars`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[s.bottomRow, compact && { flexDirection: "column" }]}>
        <Pressable
          accessibilityRole="button"
          onPress={onDaily}
          style={[s.rewardCard, { backgroundColor: "#F8F0DC" }]}
        >
          <View style={[s.rewardIcon, { backgroundColor: "#F1E4BF" }]}>
            <Icon name="gift" color="#B38C37" size={29} />
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", gap: 9, alignItems: "center" }}
            >
              <Title style={{ fontSize: 18 }}>
                A little gift for showing up
              </Title>
              {!daily.claimed && (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: c.orange,
                  }}
                />
              )}
            </View>
            <Body style={{ fontSize: 12, color: "#9A8D6A" }}>
              Your daily dose of adventure. Come back, collect, repeat.
            </Body>
          </View>
          <View style={{ gap: 5, alignItems: "center" }}>
            <View
              style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
            >
              <Coin size={15} />
              <Text
                style={{ fontFamily: f.extra, color: "#8D773F", fontSize: 13 }}
              >
                +{daily.reward}
              </Text>
            </View>
            <Text
              style={{ fontSize: 11, fontFamily: f.extra, color: "#8D773F" }}
            >
              {daily.claimed ? "Claimed ✓" : "Claim reward →"}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigate("Achievements")}
          style={[s.rewardCard, { backgroundColor: "#ECF0E7", flex: 0.7 }]}
        >
          <View style={[s.rewardIcon, { backgroundColor: "#DEE7D5" }]}>
            <Icon name="medal" color="#809565" size={29} />
          </View>
          <View style={{ flex: 1 }}>
            <Title style={{ fontSize: 18 }}>Make your mark</Title>
            <Body style={{ fontSize: 12 }}>
              Little milestones. Big fox energy.
            </Body>
          </View>
          <Icon name="chevron" size={16} color="#809565" />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 7,
          marginBottom: 4,
        }}
      >
        <Icon name="leaf" color="#B2BAAA" size={13} />
        <Text style={{ fontSize: 11, fontFamily: f.body, color: "#A3AB9D" }}>
          Made for curious paws and adventurous hearts.
        </Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  saveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#5F8B54" },
  small: { fontFamily: f.body, fontSize: 10, color: c.muted },
  hero: {
    height: 308,
    borderRadius: 19,
    backgroundColor: "#E6F0DD",
    overflow: "hidden",
    position: "relative",
  },
  heroArt: { position: "absolute", right: 0, top: 0, bottom: 0, width: "68%" },
  heroCopy: { padding: 33, width: "48%" },
  tag: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
  tagText: {
    fontSize: 9,
    letterSpacing: 1.7,
    fontFamily: f.extra,
    color: "#62815A",
  },
  heroTitle: {
    fontFamily: f.title,
    fontSize: 49,
    lineHeight: 50,
    color: "#294D35",
  },
  levelHint: {
    fontFamily: f.extra,
    fontSize: 10,
    color: "#45693E",
    letterSpacing: 1,
  },
  heroCaption: {
    position: "absolute",
    right: 20,
    bottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#41623E80",
    padding: 8,
    borderRadius: 8,
  },
  stats: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 19,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    gap: 0,
  },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 21,
    paddingVertical: 3,
  },
  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontFamily: f.title, fontSize: 23, color: c.ink },
  statOf: { fontFamily: f.bold, fontSize: 10, color: "#ADB3A5" },
  statLabel: { fontSize: 10, fontFamily: f.body, color: c.muted, marginTop: 3 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    gap: 12,
  },
  textLink: { flexDirection: "row", alignItems: "center", gap: 9 },
  link: { fontSize: 11, fontFamily: f.extra, color: c.green },
  worlds: { flexDirection: "row", gap: 18 },
  worldCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "white",
  },
  worldNumber: {
    position: "absolute",
    left: 14,
    top: 14,
    backgroundColor: "#FFFFFFD9",
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  worldNumberText: {
    fontFamily: f.extra,
    fontSize: 8,
    letterSpacing: 1.4,
    color: "#536448",
  },
  lockBadge: {
    position: "absolute",
    right: 13,
    top: 12,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#FFFFFFAA",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetail: { fontSize: 11, fontFamily: f.bold, color: c.muted },
  bottomRow: { flexDirection: "row", gap: 18 },
  rewardCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 19,
    borderRadius: 13,
  },
  rewardIcon: {
    width: 47,
    height: 51,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
});
