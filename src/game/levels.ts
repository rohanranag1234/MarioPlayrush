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
export type EnemyKind = "crawler" | "hunter" | "brute" | "boss";
export type Enemy = {
  x: number;
  y: number;
  min: number;
  max: number;
  kind: EnemyKind;
  size: number;
  speed: number;
  health: number;
  boss?: boolean;
};
export type Hazard = { x: number; y: number; w: number; h: number };
export type Level = {
  id: number;
  name: string;
  world: World;
  width: number;
  time: number;
  platforms: Platform[];
  items: Item[];
  enemies: Enemy[];
  hazards: Hazard[];
  checkpoint: number;
  flag: number;
  target: number;
  challenge: string;
  difficulty: number;
  scenery: number;
};
import { scoreTarget } from "./scoring";

const courses = [
  {
    name: "Broken Trail",
    hint: "Watch the gaps. Keep your jumps close to the edge.",
  },
  {
    name: "Ridge Runner",
    hint: "Climb the staggered ledges for hidden treasure.",
  },
  { name: "Thorn Passage", hint: "Clear the spike beds with a running jump." },
  {
    name: "Monster March",
    hint: "Hunters charge when you get close. Stomp from above.",
  },
  { name: "Highwire Hollow", hint: "Narrow ledges reward precise landings." },
];
function randomFor(id: number) {
  let seed = Math.imul(id, 2654435761) >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Stable, distinct courses: every ID changes terrain, treasure, patrols and pacing.
// This is deterministic level generation, not a claim of 100 hand-authored stages.
export function makeLevel(id: number): Level {
  if (!Number.isInteger(id) || id < 1 || id > 100)
    throw new RangeError("Level must be 1–100");
  const random = randomFor(id),
    world = WORLDS[Math.floor((id - 1) / 10)];
  const course = courses[(id - 1) % courses.length];
  const width = 2600 + id * 36;
  const gapCount = id === 1 ? 1 : 2 + Math.floor((id - 2) / 14);
  const gapWidth = 70 + Math.floor(id * 0.65);
  const gaps = Array.from(
    { length: gapCount },
    () => gapWidth + Math.floor(random() * 15),
  );
  const weights = Array.from(
    { length: gapCount + 1 },
    () => 0.9 + random() * 0.2,
  );
  const available = width - gaps.reduce((sum, g) => sum + g, 0),
    sum = weights.reduce((n, w) => n + w, 0);
  const floors: Platform[] = [];
  let cursor = 0;
  weights.forEach((weight, i) => {
    const w =
      i === gapCount ? width - cursor : Math.floor((available * weight) / sum);
    floors.push({ x: cursor, y: 360, w, h: 100 });
    cursor += w + (gaps[i] || 0);
  });
  const platforms: Platform[] = [...floors];
  const checkpointFloor = floors[Math.floor(floors.length / 2)];
  const checkpoint = checkpointFloor.x + 55;
  const flag = width - 90;
  const platformWidth = Math.max(110, 190 - Math.floor(id * 0.75));
  const ledges: Platform[] = [];
  floors.forEach((floor, i) => {
    const count = Math.max(1, Math.floor(floor.w / 330));
    for (let j = 0; j < count; j++) {
      const x = floor.x + 100 + (j * (floor.w - 140)) / count;
      const y = 275 - ((id + i + j) % 3) * 10;
      const ledge = {
        x,
        y,
        w: Math.min(platformWidth, floor.x + floor.w - x - 30),
        h: 20,
      };
      ledges.push(ledge);
      platforms.push(ledge);
      if ((id + i + j) % 3 === 1 && ledge.w >= 130) {
        platforms.push({
          x: x + 65,
          y: y - 70,
          w: Math.max(90, platformWidth - 45),
          h: 18,
        });
      }
    }
  });
  let itemId = 0;
  const items: Item[] = [];
  const add = (x: number, y: number, kind: ItemKind) =>
    items.push({ id: itemId++, x, y, kind });
  floors.forEach((floor) => {
    for (let x = floor.x + 90; x < floor.x + floor.w - 70; x += 76)
      add(x, 330, items.length % 11 === 10 ? "bigCoin" : "coin");
  });
  ledges.forEach((ledge, i) => {
    for (let x = ledge.x + 24; x < ledge.x + ledge.w - 12; x += 45)
      add(x, ledge.y - 27, "coin");
    if (i % 2 === 0) add(ledge.x + ledge.w / 2, ledge.y - 55, "gem");
  });
  // Fixed token slots keep repeated runs of these generated courses stable.
  [0.15, 0.5, 0.85].forEach((ratio, index) => {
    const ledge =
      ledges[
        Math.min(ledges.length - 1, Math.floor((ledges.length - 1) * ratio))
      ];
    items.push({
      id: 1000 + index,
      x: ledge.x + ledge.w * 0.6,
      y: ledge.y - 28,
      kind: "token",
    });
  });
  add(
    230,
    330,
    (["berry", "boots", "shield", "magnet", "heart"] as ItemKind[])[
      (id - 1) % 5
    ],
  );
  add(checkpoint + 25, 330, "berry");
  const secret = platforms.filter((p) => p.h < 30).at(-1)!;
  add(secret.x + secret.w / 2, secret.y - 28, "secret");
  // Later targets have enough optional treasure to support three-star runs.
  const gems = Math.ceil(Math.max(0, scoreTarget(id) - 6500) / 250);
  for (let i = 0; i < gems; i++) {
    const ledge = ledges[i % ledges.length];
    const row = Math.floor(i / ledges.length);
    add(
      ledge.x + 20 + ((row * 22) % (ledge.w - 30)),
      ledge.y - 30 - (row % 2) * 22,
      "gem",
    );
  }
  const enemies: Enemy[] = [];
  const enemyCount = 2 + Math.floor(id / 5);
  for (let i = 0; i < enemyCount; i++) {
    const floor = floors[i % floors.length];
    const rank = Math.floor(i / floors.length);
    const x = floor.x + floor.w * (0.46 + rank * 0.14);
    if (x > flag - 180 || Math.abs(x - checkpoint) < 140) continue;
    const kind: EnemyKind =
      id >= 12 && (i + id) % 4 === 0
        ? "brute"
        : id >= 4 && (i === 0 || (i + id) % 3 === 0)
          ? "hunter"
          : "crawler";
    const size = kind === "brute" ? 42 : kind === "hunter" ? 34 : 30;
    enemies.push({
      x,
      y: 360 - size,
      min: Math.max(floor.x + 90, x - 65),
      max: Math.min(floor.x + floor.w - size - 50, x + 65),
      kind,
      size,
      speed: 46 + id * 1.05,
      health: kind === "brute" ? 2 : 1,
    });
  }
  if (id % 10 === 0) {
    const floor = floors.at(-1)!;
    enemies.push({
      x: width - 250,
      y: 300,
      min: Math.max(floor.x + 100, width - 365),
      max: width - 150,
      kind: "boss",
      size: 60,
      speed: 70 + id * 0.7,
      health: 3 + Math.floor(id / 30),
      boss: true,
    });
  }
  const hazards: Hazard[] = [];
  if (id >= 3)
    floors.forEach((floor, i) => {
      if ((i + id) % 3 === 0 || id >= 35) {
        const x = floor.x + floor.w * 0.72,
          w = 28 + Math.floor(id / 10) * 3;
        if (
          x < flag - 150 &&
          Math.abs(x - checkpoint) > 135 &&
          floor.x + floor.w - x > w + 65
        )
          hazards.push({ x, y: 340, w, h: 20 });
      }
    });
  return {
    id,
    name:
      id % 10 === 0 ? `${world.name}: Dread Guardian` : `${course.name} ${id}`,
    world,
    width,
    time: Math.ceil(width / (72 + id * 0.4)) + (id % 10 === 0 ? 70 : 40),
    platforms,
    items,
    enemies,
    hazards,
    checkpoint,
    flag,
    target: scoreTarget(id),
    challenge:
      id % 10 === 0
        ? "Defeat the guardian before the flag will open."
        : course.hint,
    difficulty: id,
    scenery: id % 4,
  };
}
