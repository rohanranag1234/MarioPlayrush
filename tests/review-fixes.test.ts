import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, retryGame, stepGame, resultOf } from "../src/game/engine";
import { makeLevel } from "../src/game/levels";
import { emptyBreakdown, totalScore } from "../src/game/scoring";
import {
  initialProgress,
  purchaseItem,
  purchaseSkin,
  SKINS,
  dailyStatus,
  totalStars,
} from "../src/services/progress";
import { parseProgress } from "../src/services/parseProgress";
const idle = { left: false, right: false, jump: false };

test("repeated retries preserve elapsed time and cannot refund the countdown or time bonus", () => {
  const level = { ...makeLevel(1), enemies: [], hazards: [], items: [] };
  let state = { ...createGame(level), time: 30, elapsed: level.time - 30 };
  for (let attempt = 0; attempt < 3; attempt++) {
    state = stepGame(state, level, idle, 1 / 30);
    const before = state;
    state = retryGame({ ...state, status: "dead" }, level);
    assert.equal(state.time, before.time);
    assert.equal(state.elapsed, before.elapsed);
    assert.equal(resultOf(state, level).time, Math.floor(before.elapsed));
  }
  state = stepGame({ ...state, x: level.flag, y: 320 }, level, idle, 1 / 30);
  assert.equal(state.status, "complete");
  assert.equal(state.breakdown.time, Math.floor(state.time) * 10);
  assert.ok(state.breakdown.time < 300);
  assert.ok(resultOf(state, level).time >= level.time - 30);
  const expired = stepGame(
    { ...createGame(level), time: 0.001 },
    level,
    idle,
    1 / 30,
  );
  assert.equal(expired.status, "dead");
  assert.equal(retryGame(expired, level), expired);
});

test("checkpoint retry rolls rewards and boss/enemy state back together without aliasing", () => {
  const level = makeLevel(10);
  const reached = stepGame(
    { ...createGame(level), x: level.checkpoint, y: 320 },
    level,
    idle,
    1 / 60,
  );
  assert.ok(reached.checkpointState);
  const boss = level.enemies.findIndex((enemy) => enemy.boss);
  const lost = {
    ...reached,
    status: "dead" as const,
    grounded: true,
    chain: 7,
    collected: [...reached.collected, 9999],
    tokens: [1000, 1001, 1002],
    coins: reached.coins + 10,
    extraLives: reached.extraLives + 1,
    breakdown: { ...reached.breakdown, boss: 5000, tokens: 3000 },
    enemies: reached.enemies.map((enemy) => ({ ...enemy, hp: 0 })),
  };
  const retry = retryGame(lost, level);
  assert.deepEqual(retry.enemies, reached.enemies);
  assert.equal(retry.enemies[boss].hp, level.enemies[boss].health);
  assert.deepEqual(retry.breakdown, reached.breakdown);
  assert.deepEqual(retry.collected, reached.collected);
  assert.deepEqual(retry.tokens, reached.tokens);
  assert.equal(retry.coins, reached.coins);
  assert.equal(retry.extraLives, reached.extraLives);
  assert.equal(retry.grounded, false);
  assert.equal(retry.chain, 0);
  assert.equal(retry.damaged, true);
  assert.equal(
    stepGame({ ...retry, x: level.flag, y: 320 }, level, idle, 1 / 60).status,
    "playing",
  );
  retry.enemies[boss].hp = 0;
  retry.breakdown.boss = 5000;
  retry.collected.push(9999);
  const second = retryGame({ ...retry, status: "dead" }, level);
  assert.deepEqual(second.enemies, reached.enemies);
  assert.deepEqual(second.breakdown, reached.breakdown);
  assert.deepEqual(second.collected, reached.collected);
});

test("retry before checkpoint discards attempt rewards and restores enemies", () => {
  const level = makeLevel(1);
  const initial = createGame(level);
  const state = retryGame(
    {
      ...initial,
      status: "dead",
      coins: 8,
      tokens: [1000],
      collected: [1, 1000],
      extraLives: 1,
      breakdown: { ...emptyBreakdown(), tokens: 1000 },
      enemies: initial.enemies.map((enemy) => ({ ...enemy, hp: 0 })),
    },
    level,
  );
  assert.equal(totalScore(state.breakdown), 0);
  assert.equal(state.coins, 0);
  assert.equal(state.extraLives, 0);
  assert.deepEqual(state.tokens, []);
  assert.deepEqual(state.collected, []);
  assert.deepEqual(state.enemies, initial.enemies);
});

test("queued item purchases cannot overspend or charge for a full life bank", () => {
  const boots = { id: "boots", price: 150 };
  let state = { ...initialProgress(), coins: 200 };
  const buy = (prev: typeof state) => purchaseItem(prev, boots);
  state = buy(state);
  assert.equal(state.coins, 50);
  assert.equal(state.inventory.boots, 1);
  assert.equal(buy(state), state);
  const almostFull = { ...initialProgress(), lives: 4, coins: 200 };
  const full = purchaseItem(almostFull, { id: "life", price: 100 });
  assert.equal(full.lives, 5);
  assert.equal(full.coins, 100);
  assert.equal(purchaseItem(full, { id: "life", price: 100 }), full);
});

test("queued skin purchases recheck ownership and the remaining balance", () => {
  const golden = SKINS.find((skin) => skin.id === "golden")!;
  const forest = SKINS.find((skin) => skin.id === "forest")!;
  const first = purchaseSkin({ ...initialProgress(), coins: 1200 }, golden);
  const second = purchaseSkin(first, golden);
  assert.equal(second.coins, 400);
  assert.equal(second.skins.filter((id) => id === golden.id).length, 1);
  assert.equal(purchaseSkin(second, forest), second);
  const equipped = purchaseSkin({ ...second, coins: 0 }, golden);
  assert.equal(equipped.skin, "golden");
  assert.equal(equipped.coins, 0);
});

test("valid saved progress round trips, including nested records", () => {
  const progress = initialProgress();
  progress.levels[1] = {
    score: 4321,
    stars: 2,
    tokens: [1000, 1001],
    time: 60,
    attempts: 3,
  };
  progress.inventory = { boots: 2, shield: 1 };
  progress.daily = { day: 2, claimed: "2026-10-05" };
  progress.claimedAchievements = ["first-step"];
  assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
});

test("malformed required save fields and level records are rejected", () => {
  const base = initialProgress();
  for (const value of [
    null,
    [],
    3,
    "data",
    {},
    { ...base, version: 2 },
    { ...base, coins: -1 },
    { ...base, coins: "2" },
    { ...base, collectedCoins: null },
    { ...base, lives: 6 },
    { ...base, lifeAt: -1 },
    { ...base, highest: 101 },
    { ...base, nickname: {} },
    { ...base, levels: [] },
    { ...base, levels: { 1: null } },
    { ...base, levels: { 1: {} } },
  ])
    assert.throws(() => parseProgress(JSON.stringify(value)));
  assert.throws(() => parseProgress('{"coins":'));
  assert.throws(() =>
    parseProgress(JSON.stringify(base).replace('"coins":0', '"coins":1e400')),
  );
  const best = { score: 1, stars: 1, tokens: [1000], time: 1, attempts: 1 };
  for (const patch of [
    { score: -1 },
    { stars: 4 },
    { time: -3 },
    { attempts: 0 },
    { tokens: null },
    { tokens: [1000, 1000] },
    { tokens: ["1000"] },
  ]) {
    assert.throws(() =>
      parseProgress(
        JSON.stringify({ ...base, levels: { 1: { ...best, ...patch } } }),
      ),
    );
  }
  assert.throws(() =>
    parseProgress(JSON.stringify({ ...base, levels: { 101: best } })),
  );
});

test("invalid optional save values fall back without breaking downstream reads", () => {
  for (const value of [null, 42, "bad", [], { invalid: true }]) {
    const loaded = parseProgress(
      JSON.stringify({
        ...initialProgress(),
        skins: value,
        claimedAchievements: value,
        inventory: value,
        daily: value,
        settings: value,
        skin: value,
      }),
    );
    assert.equal(loaded.skin, "rusty");
    assert.ok(loaded.skins.includes("rusty"));
    assert.deepEqual(loaded.inventory, {});
    assert.deepEqual(loaded.claimedAchievements, []);
    assert.equal(dailyStatus(loaded).day, 1);
    assert.equal(totalStars(loaded), 0);
    assert.equal(loaded.settings.music, true);
  }
  const loaded = parseProgress(
    JSON.stringify({
      ...initialProgress(),
      inventory: { boots: -2, shield: 3, unknown: 9 },
      skins: [null],
      claimedAchievements: [5],
      settings: { music: false, vibration: "false", largeControls: null },
      daily: { day: 8, claimed: "2026-10-05" },
    }),
  );
  assert.deepEqual(loaded.inventory, { shield: 3 });
  assert.equal(loaded.settings.music, false);
  assert.equal(loaded.settings.vibration, true);
  assert.equal(loaded.settings.largeControls, false);
  assert.equal(dailyStatus(loaded).day, 1);
  for (const daily of [
    { day: 0, claimed: "2026-10-05" },
    { day: 1, claimed: "2026-02-30" },
    { day: 2, claimed: 7 },
  ]) {
    assert.deepEqual(
      parseProgress(JSON.stringify({ ...initialProgress(), daily })).daily,
      { day: 0, claimed: null },
    );
  }
});
