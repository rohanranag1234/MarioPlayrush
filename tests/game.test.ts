import { test } from "node:test";
import assert from "node:assert/strict";
import {
  earnedStars,
  scoreTarget,
  stompPoints,
  totalScore,
  emptyBreakdown,
} from "../src/game/scoring";
import { makeLevel } from "../src/game/levels";
import { createGame, stepGame, retryGame, resultOf } from "../src/game/engine";
import {
  initialProgress,
  dailyStatus,
  refillLives,
  canPlay,
} from "../src/services/progress";
const idle = { left: false, right: false, jump: false };
test("brief scoring: finish requirement, token OR target for 2 stars, both for 3", () => {
  assert.equal(earnedStars(false, 3, 99999, 4000), 0);
  assert.equal(earnedStars(true, 0, 0, 4000), 1);
  assert.equal(earnedStars(true, 2, 100, 4000), 2);
  assert.equal(earnedStars(true, 0, 4000, 4000), 2);
  assert.equal(earnedStars(true, 3, 3999, 4000), 2);
  assert.equal(earnedStars(true, 3, 4000, 4000), 3);
  assert.equal(scoreTarget(1), 4000);
  assert.equal(scoreTarget(100), 20000);
  assert.deepEqual([1, 2, 3, 4].map(stompPoints), [100, 300, 500, 900]);
  assert.equal(
    totalScore({
      ...emptyBreakdown(),
      coins: 830,
      enemies: 1500,
      powerUps: 200,
      secrets: 500,
      tokens: 2000,
      checkpoints: 300,
      finish: 1000,
      time: 620,
    }),
    6950,
  );
});
test("every level has three unique tokens, a checkpoint, and reachable flag", () => {
  for (let id = 1; id <= 100; id++) {
    const l = makeLevel(id);
    assert.equal(l.items.filter((i) => i.kind === "token").length, 3);
    assert.equal(new Set(l.items.map((i) => i.id)).size, l.items.length);
    assert.ok(l.checkpoint > 0 && l.checkpoint < l.flag && l.flag < l.width);
    assert.equal(
      l.enemies.some((e) => e.boss),
      id % 10 === 0,
    );
  }
});
test("gravity lands the hero and jump is edge-triggered", () => {
  const l = makeLevel(1);
  let s = createGame(l);
  for (let i = 0; i < 60; i++) s = stepGame(s, l, idle, 1 / 60);
  assert.equal(s.y, 320);
  assert.equal(s.grounded, true);
  s = stepGame(s, l, { ...idle, jump: true }, 1 / 60);
  assert.ok(s.vy < 0);
  const v = s.vy;
  s = stepGame(s, l, { ...idle, jump: true }, 1 / 60);
  assert.ok(s.vy > v);
});
test("coins cannot be farmed twice and score does not become currency", () => {
  const l = makeLevel(1);
  const item = l.items.find((i) => i.kind === "coin")!;
  let s = { ...createGame(l), x: item.x - 15, y: item.y - 20 };
  s = stepGame(s, l, idle, 1 / 60);
  const collected = s.coins;
  assert.ok(collected > 0);
  s = stepGame(s, l, idle, 1 / 60);
  assert.equal(s.coins, collected);
  assert.ok(s.breakdown.coins >= collected * 10);
});
test("checkpoint retry retains collectibles without duplicating the checkpoint reward", () => {
  const l = makeLevel(1);
  let s = { ...createGame(l), x: l.checkpoint, y: 320 };
  s = stepGame(s, l, idle, 1 / 60);
  assert.equal(s.checkpoint, true);
  assert.equal(s.breakdown.checkpoints, 300);
  s = retryGame({ ...s, status: "dead" });
  s = stepGame(s, l, idle, 1 / 60);
  assert.equal(s.breakdown.checkpoints, 300);
  assert.equal(s.damaged, true);
});
test("boss blocks flag until defeated; finishing awards correct bonuses once", () => {
  const l = makeLevel(10);
  let s = { ...createGame(l), x: l.flag, y: 320 };
  s = stepGame(s, l, idle, 1 / 60);
  assert.equal(s.status, "playing");
  s.enemies = s.enemies.map((e) => ({ ...e, hp: 0 }));
  s = stepGame(s, l, idle, 1 / 60);
  assert.equal(s.status, "complete");
  assert.equal(s.breakdown.finish, 1000);
  assert.equal(s.breakdown.noDamage, 1000);
  assert.deepEqual(stepGame(s, l, idle, 1 / 60), s);
  assert.ok(resultOf(s, l).stars >= 1);
});
test("pits and expiry cause death; shield prevents contact damage", () => {
  const l = makeLevel(1);
  assert.equal(
    stepGame({ ...createGame(l), y: 500 }, l, idle, 1 / 60).status,
    "dead",
  );
  assert.equal(
    stepGame({ ...createGame(l), time: 0.001 }, l, idle, 1 / 60).status,
    "dead",
  );
  const e = l.enemies[0];
  const s = stepGame(
    { ...createGame(l, "shield"), x: e.x, y: e.y },
    l,
    idle,
    1 / 60,
  );
  assert.equal(s.hearts, 1);
  assert.equal(s.enemies[0].hp, 0);
  assert.equal(s.breakdown.enemies, 150);
});
test("daily reward is UTC-based, continues yesterday, resets gaps, and wraps day seven", () => {
  const p = initialProgress(),
    today = new Date("2026-10-05T12:00:00Z");
  assert.equal(dailyStatus(p, today).day, 1);
  p.daily = { day: 3, claimed: "2026-10-05" };
  assert.equal(dailyStatus(p, today).claimed, true);
  p.daily = { day: 3, claimed: "2026-10-04" };
  assert.equal(dailyStatus(p, today).day, 4);
  p.daily = { day: 7, claimed: "2026-10-04" };
  assert.equal(dailyStatus(p, today).day, 1);
  p.daily = { day: 3, claimed: "2026-10-02" };
  assert.equal(dailyStatus(p, today).day, 1);
});
test("lives refill without exceeding five; worlds require both progression and stars", () => {
  let p = initialProgress();
  p = { ...p, lives: 2, lifeAt: 0 };
  assert.equal(refillLives(p, 1200000).lives, 3);
  assert.equal(refillLives(p, 12000000).lives, 5);
  p.highest = 11;
  assert.equal(canPlay(p, 11), false);
  for (let i = 1; i <= 5; i++)
    p.levels[i] = { score: 4000, stars: 3, tokens: [], time: 60, attempts: 1 };
  assert.equal(canPlay(p, 11), true);
  assert.equal(canPlay(p, 12), false);
});

test("recorded player inputs complete level one through collisions without teleporting", () => {
  const level = makeLevel(1);
  const jumps = new Set([
    8, 54, 72, 91, 125, 163, 195, 248, 287, 352, 394, 423, 495, 527, 579, 622,
  ]);
  let game = createGame(level);
  for (let tick = 0; tick < 1000 && game.status === "playing"; tick++) {
    game = stepGame(
      game,
      level,
      { left: false, right: true, jump: jumps.has(tick) },
      1 / 60,
    );
  }
  assert.equal(game.status, "complete");
  assert.ok(game.checkpoint);
  assert.ok(game.coins > 0);
  assert.equal(resultOf(game, level).stars, 2);
});
