export type LevelBest = {
  score: number;
  stars: number;
  tokens: number[];
  time: number;
  attempts: number;
};
export type Settings = {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  leftHanded: boolean;
  largeControls: boolean;
  reducedMotion: boolean;
};
export type Progress = {
  version: 1;
  nickname: string;
  coins: number;
  collectedCoins: number;
  lives: number;
  lifeAt: number;
  highest: number;
  levels: Record<number, LevelBest>;
  skins: string[];
  skin: string;
  inventory: Record<string, number>;
  daily: { day: number; claimed: string | null };
  claimedAchievements: string[];
  settings: Settings;
};
export const initialProgress = (): Progress => ({
  version: 1,
  nickname: "Adventurer",
  coins: 0,
  collectedCoins: 0,
  lives: 5,
  lifeAt: Date.now(),
  highest: 1,
  levels: {},
  skins: ["rusty", "arctic", "midnight", "rose"],
  skin: "rusty",
  inventory: {},
  daily: { day: 0, claimed: null },
  claimedAchievements: [],
  settings: {
    sound: true,
    music: true,
    vibration: true,
    leftHanded: false,
    largeControls: false,
    reducedMotion: false,
  },
});
export const totalStars = (p: Progress) =>
  Object.values(p.levels).reduce((n, l) => n + l.stars, 0);
export const totalPoints = (p: Progress) =>
  Object.values(p.levels).reduce((n, l) => n + l.score, 0);
export const worldRequirement = (world: number) => (world - 1) * 15;
export const canPlay = (p: Progress, level: number) =>
  level <= p.highest &&
  totalStars(p) >= worldRequirement(Math.ceil(level / 10));
export function refillLives(p: Progress, now = Date.now()): Progress {
  if (p.lives >= 5) return p;
  const count = Math.floor((now - p.lifeAt) / 1200000);
  if (count <= 0) return p;
  return {
    ...p,
    lives: Math.min(5, p.lives + count),
    lifeAt: p.lifeAt + count * 1200000,
  };
}
export function dailyStatus(p: Progress, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000)
    .toISOString()
    .slice(0, 10);
  const claimed = p.daily.claimed === today;
  const day = claimed
    ? p.daily.day
    : p.daily.claimed === yesterday
      ? (p.daily.day % 7) + 1
      : 1;
  return {
    today,
    claimed,
    day,
    reward: [100, 150, 200, 250, 300, 400, 750][day - 1],
  };
}
export const SKINS = [
  { id: "rusty", name: "Classic Rusty", color: "#E98346", price: 0 },
  { id: "arctic", name: "Arctic Fox", color: "#C4D7DC", price: 0 },
  { id: "midnight", name: "Midnight Fox", color: "#7F839E", price: 0 },
  { id: "rose", name: "Rose Fox", color: "#D98E99", price: 0 },
  { id: "golden", name: "Golden Hour", color: "#DDB553", price: 800 },
  { id: "forest", name: "Forest Spirit", color: "#8FAA7B", price: 1200 },
];
// Replace this adapter when a real backend is configured. Never present local scores as verified.
export interface CloudService {
  signIn(provider: "google" | "apple"): Promise<void>;
  sync(progress: Progress): Promise<Progress>;
  leaderboard(
    scope: "world" | "country" | "friends",
  ): Promise<{ nickname: string; points: number }[]>;
}
export const cloudService: CloudService = {
  async signIn() {
    throw new Error(
      "Cloud accounts are not configured in this build. Your guest progress is saved on this device.",
    );
  },
  async sync() {
    throw new Error("Cloud sync is not configured.");
  },
  async leaderboard() {
    return [];
  },
};
