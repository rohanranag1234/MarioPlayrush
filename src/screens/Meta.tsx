import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Switch,
  useWindowDimensions,
} from "react-native";
import {
  Progress,
  SKINS,
  totalStars,
  totalPoints,
  dailyStatus,
  Settings,
  cloudService,
} from "../services/progress";
import { colors as c, fonts as f } from "../theme";
import { Fox } from "../components/Art";
import { Icon, Coin } from "../components/Icon";
import {
  Button,
  Title,
  Body,
  Label,
  Currency,
  ProgressBar,
} from "../components/UI";
export type MetaProps = {
  p: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  notify: (s: string) => void;
};
const card = {
  backgroundColor: "white",
  borderWidth: 1,
  borderColor: c.border,
  borderRadius: 16,
  padding: 24,
};
export function Heading({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ gap: 6, marginBottom: 8 }}>
      <Label>{label}</Label>
      <Title style={{ fontSize: 34 }}>{title}</Title>
      <Body>{subtitle}</Body>
    </View>
  );
}
export function Shop({ p, update, notify }: MetaProps) {
  const [tab, setTab] = useState("Skins");
  return (
    <View style={{ gap: 23 }}>
      <Heading
        label="THE FOX’S LITTLE FINDS"
        title="A little something for the journey"
        subtitle="New looks, a little boost, and everything you need for the trail."
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["Skins", "Power-ups", "Lives"].map((t) => (
            <Button key={t} secondary={t !== tab} onPress={() => setTab(t)}>
              {t}
            </Button>
          ))}
        </View>
        <Currency amount={p.coins} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
        {tab === "Skins"
          ? SKINS.map((skin) => {
              const owned = p.skins.includes(skin.id);
              return (
                <View
                  key={skin.id}
                  style={[
                    card,
                    {
                      flexGrow: 1,
                      flexBasis: 240,
                      alignItems: "center",
                      gap: 15,
                    },
                  ]}
                >
                  <View
                    style={{
                      backgroundColor: "#F3F5ED",
                      borderRadius: 70,
                      padding: 10,
                    }}
                  >
                    <Fox size={110} color={skin.color} />
                  </View>
                  <Title style={{ fontSize: 21 }}>{skin.name}</Title>
                  <Body style={{ fontSize: 12 }}>
                    {skin.price === 0
                      ? "A gift for every adventurer"
                      : "A new look for curious paws"}
                  </Body>
                  <Button
                    secondary={p.skin !== skin.id}
                    disabled={p.skin === skin.id}
                    onPress={() => {
                      if (!owned && p.coins < skin.price) {
                        notify(
                          "A few more coins to go! Collect coins in levels or claim your daily gift.",
                        );
                        return;
                      }
                      update((prev) => ({
                        ...prev,
                        coins: prev.coins - (owned ? 0 : skin.price),
                        skins: owned ? prev.skins : [...prev.skins, skin.id],
                        skin: skin.id,
                      }));
                      notify(`${skin.name} equipped. Looking adventurous!`);
                    }}
                  >
                    {p.skin === skin.id
                      ? "Equipped ✓"
                      : owned
                        ? "Equip skin"
                        : `${skin.price} coins · Buy`}
                  </Button>
                </View>
              );
            })
          : (tab === "Power-ups"
              ? [
                  {
                    id: "boots",
                    name: "Rocket Boots",
                    icon: "bolt",
                    price: 150,
                    description: "Jump higher for 15 seconds.",
                  },
                  {
                    id: "shield",
                    name: "Star Shield",
                    icon: "shield",
                    price: 200,
                    description: "10 seconds of invincibility.",
                  },
                ]
              : [
                  {
                    id: "life",
                    name: "A little more adventure",
                    icon: "heart",
                    price: 100,
                    description: "Refill one life, up to five.",
                  },
                ]
            ).map((item) => (
              <View
                key={item.id}
                style={[
                  card,
                  { flex: 1, minWidth: 230, gap: 18, alignItems: "center" },
                ]}
              >
                <Icon name={item.icon} size={45} color={c.orange} />
                <Title style={{ fontSize: 23 }}>{item.name}</Title>
                <Body>{item.description}</Body>
                <Label>
                  {item.id === "life"
                    ? `${p.lives} / 5 LIVES`
                    : `${p.inventory[item.id] || 0} IN YOUR BACKPACK`}
                </Label>
                <Button
                  onPress={() => {
                    if (item.id === "life" && p.lives >= 5) {
                      notify("Your hearts are already full!");
                      return;
                    }
                    if (p.coins < item.price) {
                      notify(
                        "You need a few more coins. Your daily reward is a good place to start.",
                      );
                      return;
                    }
                    update((prev) => ({
                      ...prev,
                      coins: prev.coins - item.price,
                      lives:
                        item.id === "life"
                          ? Math.min(5, prev.lives + 1)
                          : prev.lives,
                      inventory:
                        item.id === "life"
                          ? prev.inventory
                          : {
                              ...prev.inventory,
                              [item.id]: (prev.inventory[item.id] || 0) + 1,
                            },
                    }));
                    notify(`${item.name} added!`);
                  }}
                >
                  {item.price} coins · Buy
                </Button>
              </View>
            ))}
      </View>
    </View>
  );
}
export function Daily({ p, update, notify }: MetaProps) {
  const d = dailyStatus(p);
  return (
    <View style={{ gap: 23 }}>
      <Heading
        label="GOOD TO SEE YOU AGAIN"
        title="Little gifts. Happy trails."
        subtitle="A small thank-you for making adventure part of your day. Rewards reset at midnight UTC."
      />
      <View style={[card, { alignItems: "center", padding: 35, gap: 20 }]}>
        <View
          style={{ backgroundColor: "#FBF1D8", padding: 25, borderRadius: 50 }}
        >
          <Icon name="gift" size={47} color="#C99B38" />
        </View>
        <Title>Your day {d.day} reward</Title>
        <Body>Keep your streak going for a treasure chest on day seven.</Body>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            marginVertical: 10,
          }}
        >
          {[100, 150, 200, 250, 300, 400, 750].map((n, i) => (
            <View
              key={i}
              style={{
                width: 94,
                padding: 16,
                gap: 12,
                alignItems: "center",
                borderRadius: 12,
                borderWidth: 2,
                borderColor: i + 1 === d.day ? "#B5CFA2" : c.border,
                backgroundColor: i + 1 === d.day ? "#F0F5E8" : "#FAFBF7",
              }}
            >
              <Label>DAY {i + 1}</Label>
              <Icon
                name={
                  i + 1 < d.day || (i + 1 === d.day && d.claimed)
                    ? "check"
                    : i === 6
                      ? "gift"
                      : "star"
                }
                color={i + 1 <= d.day ? c.green : "#C6B06F"}
                size={26}
              />
              <Currency amount={n} />
            </View>
          ))}
        </View>
        <Button
          disabled={d.claimed}
          icon={d.claimed ? "check" : "gift"}
          onPress={() => {
            update((prev) => {
              const current = dailyStatus(prev);
              return current.claimed
                ? prev
                : {
                    ...prev,
                    coins: prev.coins + current.reward,
                    daily: { day: current.day, claimed: current.today },
                  };
            });
            notify(`A little pocket sunshine: +${d.reward} coins!`);
          }}
        >
          {d.claimed
            ? "All yours! Come back tomorrow"
            : `Claim ${d.reward} coins`}
        </Button>
        <Body style={{ fontSize: 12 }}>
          Miss a day? Your next visit starts a fresh seven-day streak.
        </Body>
      </View>
    </View>
  );
}
export const achievements = (p: Progress) => [
  {
    id: "first",
    title: "First Steps",
    desc: "Finish your very first level.",
    value: p.levels[1] ? 1 : 0,
    target: 1,
    reward: 100,
    icon: "flag",
  },
  {
    id: "coins",
    title: "Pocketful of Sunshine",
    desc: "Collect 1,000 coins during your adventures.",
    value: p.collectedCoins,
    target: 1000,
    reward: 300,
    icon: "sun",
  },
  {
    id: "perfect",
    title: "A Little Perfectionist",
    desc: "Earn three stars on ten levels.",
    value: Object.values(p.levels).filter((l) => l.stars === 3).length,
    target: 10,
    reward: 500,
    icon: "star",
  },
  {
    id: "boss",
    title: "Brave at Heart",
    desc: "Defeat your first world guardian.",
    value: Object.keys(p.levels).some((id) => Number(id) % 10 === 0) ? 1 : 0,
    target: 1,
    reward: 400,
    icon: "crown",
  },
];
export function Achievements({ p, update, notify }: MetaProps) {
  return (
    <View style={{ gap: 20 }}>
      <Heading
        label="EVERY LITTLE WIN COUNTS"
        title="Made of little milestones"
        subtitle="Explore a little further. Jump a little higher. Celebrate how far you’ve come."
      />
      {achievements(p).map((a) => (
        <View
          key={a.id}
          style={[
            card,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            },
          ]}
        >
          <View
            style={{
              padding: 18,
              backgroundColor: "#EFF3E8",
              borderRadius: 14,
            }}
          >
            <Icon name={a.icon} size={30} color="#8A9D6D" />
          </View>
          <View style={{ flex: 1, minWidth: 140, gap: 8 }}>
            <Title style={{ fontSize: 21 }}>{a.title}</Title>
            <Body>{a.desc}</Body>
            <ProgressBar value={a.value / a.target} />
            <Label>
              {Math.min(a.target, a.value)} / {a.target}
            </Label>
          </View>
          <Button
            disabled={
              a.value < a.target || p.claimedAchievements.includes(a.id)
            }
            secondary
            onPress={() => {
              update((prev) =>
                prev.claimedAchievements.includes(a.id)
                  ? prev
                  : {
                      ...prev,
                      coins: prev.coins + a.reward,
                      claimedAchievements: [...prev.claimedAchievements, a.id],
                    },
              );
              notify(`Milestone celebrated! +${a.reward} coins.`);
            }}
          >
            {p.claimedAchievements.includes(a.id)
              ? "Collected ✓"
              : `Claim ${a.reward}`}
          </Button>
        </View>
      ))}
    </View>
  );
}
export function Leaderboard({ p }: MetaProps) {
  const [scope, setScope] = useState("World");
  const [period, setPeriod] = useState("All time");
  return (
    <View style={{ gap: 24 }}>
      <Heading
        label="GOOD COMPANY. GREAT ADVENTURES."
        title="The trailblazers"
        subtitle="Every adventure has a story. This is where the best ones will meet."
      />
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {["Friends", "Country", "World"].map((t) => (
          <Button secondary={scope !== t} key={t} onPress={() => setScope(t)}>
            {t}
          </Button>
        ))}
        <View style={{ flex: 1 }} />
        <Button
          secondary
          onPress={() =>
            setPeriod(period === "All time" ? "This week" : "All time")
          }
        >
          {period} ▾
        </Button>
      </View>
      <View
        style={[card, { alignItems: "center", gap: 18, paddingVertical: 55 }]}
      >
        <Icon name="trophy" size={52} color="#CBB376" />
        <Title>
          {scope === "Friends"
            ? "Adventures are better together"
            : scope === "Country"
              ? "Meet your local trailblazers"
              : "A world of friendly competition"}
        </Title>
        <Body style={{ textAlign: "center", maxWidth: 450 }}>
          Online rankings will be available when cloud accounts and score
          verification are connected. Keep exploring — your personal bests are
          saved here.
        </Body>
        <Label>
          {scope.toUpperCase()} · {period.toUpperCase()} · NOT CONNECTED
        </Label>
      </View>
      <View
        style={[card, { flexDirection: "row", alignItems: "center", gap: 17 }]}
      >
        <Fox size={52} color={SKINS.find((s) => s.id === p.skin)?.color} />
        <View style={{ flex: 1 }}>
          <Title style={{ fontSize: 20 }}>{p.nickname}</Title>
          <Body style={{ fontSize: 12 }}>
            Your all-time personal best · On this device
          </Body>
        </View>
        <Title style={{ fontSize: 25 }}>
          {totalPoints(p).toLocaleString()}{" "}
          <Text style={{ fontSize: 12, color: c.muted }}>PTS</Text>
        </Title>
      </View>
    </View>
  );
}
export function Profile({ p, update, notify }: MetaProps) {
  const [nickname, setNickname] = useState(p.nickname);
  return (
    <View style={{ gap: 23 }}>
      <Heading
        label="THE FOX BEHIND THE ADVENTURE"
        title="Your little corner of the forest"
        subtitle="Make yourself at home."
      />
      <View style={[card, { alignItems: "center", gap: 20 }]}>
        <Fox size={135} color={SKINS.find((s) => s.id === p.skin)?.color} />
        <Label>GUEST ADVENTURER · SAVED ON THIS DEVICE</Label>
        <TextInput
          accessibilityLabel="Nickname"
          maxLength={16}
          value={nickname}
          onChangeText={setNickname}
          style={{
            fontFamily: f.bold,
            color: c.ink,
            padding: 15,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 10,
            width: 250,
            textAlign: "center",
            fontSize: 18,
          }}
        />
        <Button
          onPress={() => {
            const name = nickname.trim();
            if (!/^[\p{L}\p{N} _-]{3,16}$/u.test(name)) {
              notify(
                "Choose 3–16 letters, numbers, spaces, underscores or hyphens.",
              );
              return;
            }
            update((prev) => ({ ...prev, nickname: name }));
            notify("Your new trail name is saved.");
          }}
        >
          Save nickname
        </Button>
        <View style={{ flexDirection: "row", gap: 35, marginVertical: 15 }}>
          {[
            [Object.keys(p.levels).length, "LEVELS"],
            [totalStars(p), "STARS"],
            [totalPoints(p), "POINTS"],
          ].map(([n, l]) => (
            <View key={l} style={{ alignItems: "center", gap: 5 }}>
              <Title>{n}</Title>
              <Label>{l}</Label>
            </View>
          ))}
        </View>
        <Button
          secondary
          onPress={() =>
            cloudService.signIn("google").catch((e) => notify(e.message))
          }
        >
          Connect Google account
        </Button>
        <Body style={{ fontSize: 12, textAlign: "center" }}>
          Guest mode is ready to play. Cloud sign-in requires a configured
          development build.
        </Body>
      </View>
    </View>
  );
}
export function SettingsScreen({
  p,
  update,
  notify,
  onReset,
}: MetaProps & { onReset: () => void }) {
  const rows: { key: keyof Settings; name: string; desc: string }[] = [
    {
      key: "leftHanded",
      name: "Left-handed controls",
      desc: "Put the jump button on the left.",
    },
    {
      key: "largeControls",
      name: "Larger buttons",
      desc: "A little extra room for your paws.",
    },
    {
      key: "reducedMotion",
      name: "Reduced motion",
      desc: "Keep collectibles still during gameplay.",
    },
  ];
  return (
    <View style={{ gap: 23 }}>
      <Heading
        label="JUST THE WAY YOU LIKE IT"
        title="A comfortable kind of adventure"
        subtitle="Make the trail feel like home."
      />
      <View style={card}>
        <Title style={{ fontSize: 23, marginBottom: 18 }}>Play your way</Title>
        {rows.map((row) => (
          <View
            key={row.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 19,
              borderTopWidth: 1,
              borderTopColor: c.border,
              gap: 15,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: f.extra, color: c.ink, fontSize: 15 }}>
                {row.name}
              </Text>
              <Body style={{ fontSize: 12 }}>{row.desc}</Body>
            </View>
            <Switch
              accessibilityLabel={row.name}
              value={p.settings[row.key]}
              onValueChange={(v) =>
                update((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, [row.key]: v },
                }))
              }
              trackColor={{ false: "#DCE1D5", true: "#8DAC79" }}
              thumbColor={c.green}
            />
          </View>
        ))}
      </View>
      <View style={[card, { gap: 15 }]}>
        <Title style={{ fontSize: 23 }}>Your adventure data</Title>
        <Body>
          Progress stays on this device. This build has no ads, purchases with
          real money, analytics, or online accounts. Clearing browser or app
          storage removes your progress.
        </Body>
        <Button
          secondary
          onPress={() =>
            notify(
              "Rusty Run stores your nickname, scores, inventory, rewards and preferences only on this device. No personal data is sent to a game server in this guest build. Fonts are bundled with the app. Cloud privacy terms will be added before online accounts launch.",
            )
          }
        >
          Privacy & local storage
        </Button>
        <Button secondary onPress={onReset}>
          Delete my local progress
        </Button>
      </View>
      <Body style={{ fontSize: 12, textAlign: "center" }}>
        RUSTY RUN 100 · v1.0.0 · Guest adventure build{"\n"}Original artwork.
        Made for curious paws.
      </Body>
    </View>
  );
}
