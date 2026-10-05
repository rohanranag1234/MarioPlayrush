export type Breakdown = {
  coins: number;
  enemies: number;
  tokens: number;
  powerUps: number;
  secrets: number;
  checkpoints: number;
  finish: number;
  time: number;
  noDamage: number;
  boss: number;
};
export const emptyBreakdown = (): Breakdown => ({
  coins: 0,
  enemies: 0,
  tokens: 0,
  powerUps: 0,
  secrets: 0,
  checkpoints: 0,
  finish: 0,
  time: 0,
  noDamage: 0,
  boss: 0,
});
export const POINTS = {
  coin: 10,
  bigCoin: 100,
  gem: 250,
  stomp: 100,
  powerDefeat: 150,
  powerUp: 200,
  secret: 500,
  starToken: 1000,
  checkpoint: 300,
  finish: 1000,
  noDamage: 1000,
  boss: 5000,
} as const;
export const scoreTarget = (level: number) =>
  Math.round(4000 + ((level - 1) * 16000) / 99);
export const stompPoints = (chain: number) =>
  POINTS.stomp + (chain > 1 ? 200 * 2 ** (chain - 2) : 0);
export const totalScore = (breakdown: Breakdown) =>
  Object.values(breakdown).reduce((sum, n) => sum + n, 0);
export const earnedStars = (
  finished: boolean,
  tokens: number,
  score: number,
  target: number,
) =>
  !finished
    ? 0
    : tokens === 3 && score >= target
      ? 3
      : tokens >= 2 || score >= target
        ? 2
        : 1;
