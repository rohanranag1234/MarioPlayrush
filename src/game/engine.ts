import { Level } from "./levels";
import {
  Breakdown,
  emptyBreakdown,
  POINTS,
  stompPoints,
  totalScore,
  earnedStars,
} from "./scoring";
export type Input = {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed?: boolean;
};
export type GameState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: number;
  time: number;
  status: "playing" | "dead" | "complete";
  collected: number[];
  enemies: { x: number; dir: number; hp: number }[];
  breakdown: Breakdown;
  coins: number;
  tokens: number[];
  hearts: number;
  damaged: boolean;
  checkpoint: boolean;
  chain: number;
  invincible: number;
  boots: number;
  magnet: number;
  shield: number;
  jumpHeld: boolean;
  jumpBuffer: number;
  coyoteTime: number;
  camera: number;
  pop: string;
  popTime: number;
  extraLives: number;
  tick: number;
};
export function createGame(level: Level, power?: string): GameState {
  return {
    x: 65,
    y: 310,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    time: level.time,
    status: "playing",
    collected: [],
    enemies: level.enemies.map((e) => ({ x: e.x, dir: 1, hp: e.health })),
    breakdown: emptyBreakdown(),
    coins: 0,
    tokens: [],
    hearts: 1,
    damaged: false,
    checkpoint: false,
    chain: 0,
    invincible: 0,
    boots: power === "boots" ? 15 : 0,
    magnet: 0,
    shield: power === "shield" ? 10 : 0,
    jumpHeld: false,
    jumpBuffer: 0,
    coyoteTime: 0,
    camera: 0,
    pop: "",
    popTime: 0,
    extraLives: 0,
    tick: 0,
  };
}
const overlap = (
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
export function retryGame(s: GameState, level: Level): GameState {
  return {
    ...s,
    x: s.checkpoint ? level.checkpoint + 20 : 65,
    y: 310,
    vx: 0,
    vy: 0,
    status: "playing",
    hearts: 1,
    invincible: 2,
    time: Math.max(60, s.time),
    damaged: true,
    jumpHeld: false,
    jumpBuffer: 0,
    coyoteTime: 0,
  };
}
function hurt(s: GameState) {
  if (s.invincible > 0 || s.shield > 0) return;
  s.damaged = true;
  s.hearts--;
  s.invincible = 2;
  s.vy = -260;
  if (s.hearts <= 0) s.status = "dead";
}
export function stepGame(
  s: GameState,
  level: Level,
  input: Input,
  dt: number,
): GameState {
  if (s.status !== "playing") return s;
  dt = Math.min(dt, 1 / 30);
  const n = {
    ...s,
    collected: [...s.collected],
    tokens: [...s.tokens],
    breakdown: { ...s.breakdown },
    enemies: s.enemies.map((e) => ({ ...e })),
    tick: s.tick + dt,
  };
  n.time = Math.max(0, n.time - dt);
  n.invincible = Math.max(0, n.invincible - dt);
  n.boots = Math.max(0, n.boots - dt);
  n.magnet = Math.max(0, n.magnet - dt);
  n.shield = Math.max(0, n.shield - dt);
  n.popTime = Math.max(0, n.popTime - dt);
  if (n.time === 0) {
    n.status = "dead";
    return n;
  }
  const dir = Number(input.right) - Number(input.left);
  n.vx = dir * 310;
  if (dir) n.facing = dir;
  n.jumpBuffer =
    input.jumpPressed || (input.jump && !s.jumpHeld)
      ? 0.12
      : Math.max(0, s.jumpBuffer - dt);
  n.coyoteTime = s.grounded ? 0.09 : Math.max(0, s.coyoteTime - dt);
  if (n.jumpBuffer > 0 && (s.grounded || n.coyoteTime > 0)) {
    n.vy = n.boots > 0 ? -710 : -625;
    n.grounded = false;
    n.jumpBuffer = 0;
    n.coyoteTime = 0;
  }
  n.jumpHeld = input.jump;
  const oldY = n.y;
  n.vy += 1550 * dt;
  n.x = Math.max(0, Math.min(level.width - 32, n.x + n.vx * dt));
  for (const p of level.platforms) {
    if (overlap(n.x, n.y, 30, 40, p.x, p.y, p.w, p.h) && oldY + 40 > p.y + 3) {
      if (n.vx > 0) n.x = p.x - 30;
      else if (n.vx < 0) n.x = p.x + p.w;
    }
  }
  n.y += n.vy * dt;
  n.grounded = false;
  for (const p of level.platforms) {
    if (overlap(n.x, n.y, 30, 40, p.x, p.y, p.w, p.h)) {
      if (n.vy >= 0 && oldY + 40 <= p.y + 5) {
        n.y = p.y - 40;
        n.vy = 0;
        n.grounded = true;
        n.chain = 0;
        if (n.jumpBuffer > 0) {
          n.vy = n.boots > 0 ? -710 : -625;
          n.grounded = false;
          n.jumpBuffer = 0;
          n.coyoteTime = 0;
        }
      } else if (n.vy < 0 && oldY >= p.y + p.h - 4) {
        n.y = p.y + p.h;
        n.vy = 0;
      }
    }
  }
  if (n.y > 490) {
    n.status = "dead";
    n.damaged = true;
  }
  const add = (key: keyof Breakdown, value: number) => {
    n.breakdown[key] += value;
    n.pop = `+${value.toLocaleString()}`;
    n.popTime = 0.8;
  };
  for (const item of level.items) {
    if (n.collected.includes(item.id)) continue;
    const reach =
      n.magnet > 0 && (item.kind === "coin" || item.kind === "bigCoin")
        ? 115
        : 23;
    if (
      Math.abs(n.x + 15 - item.x) < reach &&
      Math.abs(n.y + 20 - item.y) < reach + 8
    ) {
      n.collected.push(item.id);
      switch (item.kind) {
        case "coin":
          add("coins", POINTS.coin);
          n.coins++;
          break;
        case "bigCoin":
          add("coins", POINTS.bigCoin);
          n.coins += 10;
          break;
        case "gem":
          add("coins", POINTS.gem);
          break;
        case "token":
          add("tokens", POINTS.starToken);
          n.tokens.push(item.id);
          break;
        case "secret":
          add("secrets", POINTS.secret);
          break;
        case "heart":
          n.extraLives++;
          add("powerUps", POINTS.powerUp);
          break;
        default:
          add("powerUps", POINTS.powerUp);
          if (item.kind === "berry") n.hearts = 2;
          if (item.kind === "boots") n.boots = 15;
          if (item.kind === "shield") n.shield = 10;
          if (item.kind === "magnet") n.magnet = 15;
      }
    }
  }
  level.enemies.forEach((e, i) => {
    const enemy = n.enemies[i];
    if (enemy.hp <= 0) return;
    const chasing = e.kind === "hunter" && Math.abs(n.x - enemy.x) < 230;
    if (chasing) enemy.dir = n.x < enemy.x ? -1 : 1;
    enemy.x += enemy.dir * e.speed * (chasing ? 1.65 : 1) * dt;
    if (enemy.x > e.max) {
      enemy.x = e.max;
      enemy.dir = -1;
    }
    if (enemy.x < e.min) {
      enemy.x = e.min;
      enemy.dir = 1;
    }
    const size = e.size;
    if (overlap(n.x, n.y, 30, 40, enemy.x, e.y, size, size)) {
      if (n.shield > 0) {
        enemy.hp = 0;
        add(
          e.boss ? "boss" : "enemies",
          e.boss ? POINTS.boss : POINTS.powerDefeat,
        );
      } else if (n.vy > 0 && oldY + 40 <= e.y + 15) {
        enemy.hp--;
        n.vy = -400;
        n.chain++;
        n.y = e.y - 41;
        add(
          enemy.hp === 0 && e.boss ? "boss" : "enemies",
          enemy.hp === 0 && e.boss ? POINTS.boss : stompPoints(n.chain),
        );
      } else hurt(n);
    }
  });
  for (const hazard of level.hazards) {
    if (
      overlap(n.x + 4, n.y + 5, 22, 35, hazard.x, hazard.y, hazard.w, hazard.h)
    )
      hurt(n);
  }
  if (!n.checkpoint && n.status === "playing" && n.x >= level.checkpoint) {
    n.checkpoint = true;
    add("checkpoints", POINTS.checkpoint);
  }
  if (
    n.x >= level.flag &&
    n.status === "playing" &&
    !n.enemies.some((e, i) => level.enemies[i].boss && e.hp > 0)
  ) {
    n.status = "complete";
    n.breakdown.finish =
      POINTS.finish + Math.round(Math.max(0, Math.min(500, (320 - n.y) * 3)));
    n.breakdown.time = Math.floor(n.time) * 10;
    n.breakdown.noDamage = n.damaged ? 0 : POINTS.noDamage;
  }
  n.extraLives +=
    Math.floor(totalScore(n.breakdown) / 10000) -
    Math.floor(totalScore(s.breakdown) / 10000);
  n.camera = Math.max(0, Math.min(level.width - 900, n.x - 300));
  return n;
}
export function resultOf(s: GameState, level: Level) {
  const score = totalScore(s.breakdown);
  return {
    score,
    stars: earnedStars(
      s.status === "complete",
      s.tokens.length,
      score,
      level.target,
    ),
    tokens: s.tokens,
    time: Math.floor(level.time - s.time),
    coins: s.coins,
    extraLives: s.extraLives,
    breakdown: s.breakdown,
  };
}
