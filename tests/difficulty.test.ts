import { test } from "node:test";
import assert from "node:assert/strict";
import { makeLevel } from "../src/game/levels";
import { createGame, stepGame, retryGame, resultOf } from "../src/game/engine";
const idle = { left: false, right: false, jump: false };

test("100 stable, distinct courses with increasing length and enemy pace", () => {
  const shapes = new Set<string>();
  for (let id = 1; id <= 100; id++) {
    const level = makeLevel(id);
    assert.deepEqual(level, makeLevel(id));
    shapes.add(JSON.stringify(level.platforms));
    if (id > 1) {
      const prior = makeLevel(id - 1);
      assert.ok(level.width > prior.width);
      assert.ok(level.enemies[0].speed > prior.enemies[0].speed);
    }
    assert.equal(level.items.filter((i) => i.kind === "token").length, 3);
    assert.equal(
      new Set(level.items.map((i) => i.id)).size,
      level.items.length,
    );
    assert.ok(level.platforms.every((p) => p.w >= 90));
    assert.ok(level.enemies.every((e) => e.min <= e.x && e.x <= e.max));
  }
  assert.equal(shapes.size, 100);
  assert.ok(makeLevel(3).hazards.length > 0);
  assert.ok(makeLevel(4).enemies.some((e) => e.kind === "hunter"));
  assert.ok(makeLevel(20).enemies.some((e) => e.kind === "brute"));
  assert.throws(() => makeLevel(101), RangeError);
});

test("every generated terrain can be crossed with normal movement and jumps", () => {
  // Isolate geometry: monsters/spikes have separate combat tests below.
  for (let id = 1; id <= 100; id++) {
    const level = { ...makeLevel(id), enemies: [], hazards: [] };
    const floors = level.platforms.filter((p) => p.h === 100);
    let game = createGame(level);
    for (let frame = 0; frame < 4000 && game.status === "playing"; frame++) {
      const floor = floors.find(
        (p) => game.x >= p.x - 30 && game.x < p.x + p.w,
      );
      const jump =
        game.grounded &&
        !game.jumpHeld &&
        !!floor &&
        floor !== floors.at(-1) &&
        floor.x + floor.w - game.x < 85;
      game = stepGame(game, level, { left: false, right: true, jump }, 1 / 60);
    }
    assert.equal(
      game.status,
      "complete",
      `Terrain ${id} must be traversable without teleporting`,
    );
    assert.ok(game.checkpoint);
  }
});

test("every checkpoint retries on safe ground away from spikes and patrols", () => {
  for (let id = 1; id <= 100; id++) {
    const level = makeLevel(id);
    const game = retryGame(
      { ...createGame(level), checkpoint: true, status: "dead" },
      level,
    );
    assert.ok(
      level.platforms.some(
        (p) => p.h === 100 && game.x >= p.x && game.x + 30 <= p.x + p.w,
      ),
    );
    assert.ok(
      !level.hazards.some((h) => game.x + 30 > h.x && game.x < h.x + h.w),
    );
    assert.ok(
      !level.enemies.some(
        (e) => game.x + 30 > e.min && game.x < e.max + e.size,
      ),
    );
  }
});

test("short queued taps jump even after release; buffered jumps fire on landing", () => {
  const level = makeLevel(1);
  let game = { ...createGame(level), y: 320, grounded: true };
  game = stepGame(game, level, { ...idle, jumpPressed: true }, 1 / 60);
  assert.ok(game.vy < 0);
  assert.equal(game.jumpHeld, false);
  game = { ...createGame(level), x: 65, y: 317, vy: 180 };
  game = stepGame(game, level, { ...idle, jumpPressed: true }, 1 / 60);
  assert.ok(game.vy < 0);
  assert.equal(game.grounded, false);
});

test("coyote-time works briefly after a ledge but cannot be used for a second air jump", () => {
  const level = makeLevel(1);
  const game = stepGame(
    { ...createGame(level), x: 65, y: 290, coyoteTime: 0.06 },
    level,
    { ...idle, jumpPressed: true },
    1 / 60,
  );
  assert.ok(game.vy < 0);
  assert.equal(game.coyoteTime, 0);
  const next = stepGame(game, level, { ...idle, jumpPressed: true }, 1 / 60);
  assert.ok(next.vy > game.vy);
});

test("hunters chase; brutes need two stomps; spike contact damages the hero", () => {
  const level = makeLevel(20);
  const index = level.enemies.findIndex((e) => e.kind === "brute");
  const brute = level.enemies[index];
  let game = stepGame(
    { ...createGame(level), x: brute.x, y: brute.y - 41, vy: 180 },
    level,
    idle,
    1 / 60,
  );
  assert.equal(game.enemies[index].hp, 1);
  const hunterLevel = makeLevel(4);
  const hunterIndex = hunterLevel.enemies.findIndex((e) => e.kind === "hunter");
  const hunter = hunterLevel.enemies[hunterIndex];
  const chased = stepGame(
    { ...createGame(hunterLevel), x: hunter.x - 100 },
    hunterLevel,
    idle,
    1 / 60,
  );
  assert.equal(chased.enemies[hunterIndex].dir, -1);
  assert.ok(chased.enemies[hunterIndex].x < hunter.x);
  const spikeLevel = makeLevel(3);
  const spike = spikeLevel.hazards[0];
  game = stepGame(
    { ...createGame(spikeLevel), x: spike.x, y: 320 },
    spikeLevel,
    idle,
    1 / 60,
  );
  assert.equal(game.status, "dead");
  assert.equal(game.damaged, true);
});
