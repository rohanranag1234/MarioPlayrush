import { initialProgress, LevelBest, Progress, SKINS } from "./progress";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const integer = (
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= min &&
  value <= max;
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");
const validDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

// Keep untrusted JSON outside Progress until each field has been checked.
// Invalid required data throws so App can protect the existing save from overwrite.
export function parseProgress(data: string): Progress {
  const parsed: unknown = JSON.parse(data);
  const invalid = () => new Error("Your saved adventure could not be read.");
  if (
    !record(parsed) ||
    parsed.version !== 1 ||
    !record(parsed.levels) ||
    typeof parsed.nickname !== "string" ||
    !integer(parsed.coins) ||
    !integer(parsed.collectedCoins) ||
    !integer(parsed.lives, 0, 5) ||
    !integer(parsed.lifeAt) ||
    !integer(parsed.highest, 1, 100)
  )
    throw invalid();

  const levels: Record<number, LevelBest> = {};
  for (const [id, best] of Object.entries(parsed.levels)) {
    if (
      !/^[1-9]\d*$/.test(id) ||
      !integer(Number(id), 1, 100) ||
      !record(best) ||
      !integer(best.score) ||
      !integer(best.stars, 0, 3) ||
      !integer(best.time) ||
      !integer(best.attempts, 1) ||
      !Array.isArray(best.tokens) ||
      best.tokens.length > 3 ||
      !best.tokens.every((token) => integer(token)) ||
      new Set(best.tokens).size !== best.tokens.length
    )
      throw invalid();
    levels[Number(id)] = {
      score: best.score,
      stars: best.stars,
      time: best.time,
      attempts: best.attempts,
      tokens: [...best.tokens],
    };
  }

  const defaults = initialProgress();
  const settings = { ...defaults.settings };
  if (record(parsed.settings)) {
    for (const key of Object.keys(settings) as (keyof typeof settings)[]) {
      const value = parsed.settings[key];
      if (typeof value === "boolean") settings[key] = value;
    }
  }
  const inventory: Record<string, number> = {};
  if (record(parsed.inventory)) {
    for (const key of ["boots", "shield"]) {
      const value = parsed.inventory[key];
      if (integer(value)) inventory[key] = value;
    }
  }
  const skinIds = new Set(SKINS.map((skin) => skin.id));
  const skins =
    strings(parsed.skins) &&
    parsed.skins.length > 0 &&
    parsed.skins.every((id) => skinIds.has(id))
      ? [...new Set(["rusty", ...parsed.skins])]
      : defaults.skins;
  const skin =
    typeof parsed.skin === "string" && skins.includes(parsed.skin)
      ? parsed.skin
      : defaults.skin;
  const daily =
    record(parsed.daily) &&
    integer(parsed.daily.day, 0, 7) &&
    ((parsed.daily.claimed === null && parsed.daily.day === 0) ||
      (parsed.daily.day >= 1 && validDate(parsed.daily.claimed)))
      ? {
          day: parsed.daily.day,
          claimed: parsed.daily.claimed as string | null,
        }
      : defaults.daily;
  return {
    version: 1,
    nickname: parsed.nickname,
    coins: parsed.coins,
    collectedCoins: parsed.collectedCoins,
    lives: parsed.lives,
    lifeAt: parsed.lifeAt,
    highest: parsed.highest,
    levels,
    settings,
    inventory,
    skins,
    skin,
    daily,
    claimedAchievements: strings(parsed.claimedAchievements)
      ? [...new Set(parsed.claimedAchievements)]
      : defaults.claimedAchievements,
  };
}
