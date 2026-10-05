export type World = {
  id: number;
  name: string;
  subtitle: string;
  color: string;
  sky: string;
  ground: string;
  icon: string;
};
export const WORLDS: World[] = [
  {
    id: 1,
    name: "Green Meadows",
    subtitle: "Every adventure starts with a hop.",
    color: "#DAEACD",
    sky: "#DCEEDC",
    ground: "#78A461",
    icon: "leaf",
  },
  {
    id: 2,
    name: "Sunny Desert",
    subtitle: "A little sand. A lot of adventure.",
    color: "#FAE9C6",
    sky: "#F7E8C9",
    ground: "#D9AE6F",
    icon: "sun",
  },
  {
    id: 3,
    name: "Jungle Canopy",
    subtitle: "Take the path less traveled.",
    color: "#D4E7DF",
    sky: "#D5E8DF",
    ground: "#4E8C72",
    icon: "tree",
  },
  {
    id: 4,
    name: "Crystal Caves",
    subtitle: "Find a little sparkle in the dark.",
    color: "#E4DDF1",
    sky: "#D8D2EA",
    ground: "#9381B2",
    icon: "gem",
  },
  {
    id: 5,
    name: "Ocean Docks",
    subtitle: "Make waves, chase horizons.",
    color: "#DAEBF1",
    sky: "#DCEEF3",
    ground: "#75A5B1",
    icon: "waves",
  },
  {
    id: 6,
    name: "Frozen Peaks",
    subtitle: "Keep your paws warm.",
    color: "#E4EFF2",
    sky: "#E6F0F6",
    ground: "#9BACBB",
    icon: "mountain",
  },
  {
    id: 7,
    name: "Volcano Lands",
    subtitle: "The adventure is heating up.",
    color: "#F0DCD2",
    sky: "#F5D9CD",
    ground: "#B57765",
    icon: "flame",
  },
  {
    id: 8,
    name: "Sky Islands",
    subtitle: "A leap above the clouds.",
    color: "#E0E8F6",
    sky: "#DEEBF9",
    ground: "#8DA1C0",
    icon: "cloud",
  },
  {
    id: 9,
    name: "Machine Factory",
    subtitle: "A whole new kind of gear.",
    color: "#E4E5DC",
    sky: "#E3E6DF",
    ground: "#909C89",
    icon: "settings",
  },
  {
    id: 10,
    name: "Shadow Castle",
    subtitle: "One brave fox. One final challenge.",
    color: "#DFDBE8",
    sky: "#DCD5E7",
    ground: "#8D7DA5",
    icon: "crown",
  },
];
export type Platform = { x: number; y: number; w: number; h: number };
export type ItemKind =
  | "coin"
  | "bigCoin"
  | "gem"
  | "token"
  | "berry"
  | "boots"
  | "shield"
  | "magnet"
  | "heart"
  | "secret";
export type Item = { id: number; x: number; y: number; kind: ItemKind };
export type Enemy = {
  x: number;
  y: number;
  min: number;
  max: number;
  boss?: boolean;
};
export type Level = {
  id: number;
  name: string;
  world: World;
  width: number;
  time: number;
  platforms: Platform[];
  items: Item[];
  enemies: Enemy[];
  checkpoint: number;
  flag: number;
  target: number;
};
// The ten first-world layouts are authored here. Later worlds remix these layouts;
// they are playable prototypes, pending bespoke level design and world mechanics.
const layouts = [
  [330, 550, 850, 1140, 1480, 1780, 2130],
  [290, 520, 780, 1080, 1430, 1740, 2080],
  [360, 640, 880, 1160, 1450, 1820, 2130],
  [300, 560, 920, 1200, 1510, 1760, 2110],
  [280, 580, 870, 1170, 1460, 1800, 2150],
  [360, 610, 840, 1190, 1500, 1810, 2130],
  [320, 590, 890, 1220, 1490, 1790, 2100],
  [270, 550, 870, 1190, 1450, 1760, 2110],
  [350, 630, 930, 1170, 1480, 1830, 2110],
  [310, 560, 850, 1110, 1420, 1680, 2040],
];
const names = [
  "A Fresh Start",
  "Over the Hill",
  "The Hidden Grove",
  "Hop, Skip & Jump",
  "Berry Beautiful",
  "The Long Way Home",
  "A Fox in the Forest",
  "Higher Ground",
  "One Last Leap",
  "The Meadow Guardian",
];
import { scoreTarget } from "./scoring";
export function makeLevel(id: number): Level {
  const world = WORLDS[Math.floor((id - 1) / 10)];
  const slot = (id - 1) % 10;
  const xs = layouts[slot];
  const platforms: Platform[] = [
    { x: 0, y: 360, w: 980, h: 100 },
    { x: 1060, y: 360, w: 850, h: 100 },
    { x: 1990, y: 360, w: 810, h: 100 },
    ...xs.map((x, i) => ({
      x,
      y: i % 3 === 1 ? 205 : 270,
      w: i % 3 === 1 ? 150 : 180,
      h: 22,
    })),
  ];
  let next = 0;
  const items: Item[] = [];
  xs.forEach((x, i) => {
    for (let j = 0; j < 3; j++)
      items.push({
        id: next++,
        x: x + 30 + j * 40,
        y: (i % 3 === 1 ? 205 : 270) - 35,
        kind: "coin",
      });
  });
  for (let i = 0; i < 18; i++)
    items.push({
      id: next++,
      x: 180 + i * 130,
      y: 330,
      kind: i % 9 === 8 ? "bigCoin" : "coin",
    });
  [0, 3, 6].forEach((i) =>
    items.push({ id: next++, x: xs[i] + 80, y: 225, kind: "token" }),
  );
  items.push(
    { id: next++, x: xs[1] + 80, y: 165, kind: "gem" },
    {
      id: next++,
      x: 740,
      y: 325,
      kind: (["berry", "boots", "shield", "magnet", "heart"] as ItemKind[])[
        slot % 5
      ],
    },
    { id: next++, x: xs[5] + 70, y: 230, kind: "secret" },
  );
  const enemies: Enemy[] = [650, 1280, 1650, 2270].map((x) => ({
    x,
    y: 334,
    min: x - 70,
    max: x + 70,
  }));
  if (id % 10 === 0)
    enemies.push({ x: 2520, y: 306, min: 2400, max: 2640, boss: true });
  return {
    id,
    name: world.id === 1 ? names[slot] : `${world.name} ${slot + 1}`,
    world,
    width: 2800,
    time: id % 10 === 0 ? 240 : 180,
    platforms,
    items,
    enemies,
    checkpoint: 1370,
    flag: 2700,
    target: scoreTarget(id),
  };
}
