import React from "react";
import Svg, { Path, Circle, Rect, Polyline } from "react-native-svg";
const paths: Record<string, string> = {
  home: "M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  map: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16",
  shop: "M4 9v12h16V9 M3 9l2-6h14l2 6 M3 9q3 4 6 0 3 4 6 0 3 4 6 0 M9 21v-7h6v7",
  trophy:
    "M7 3h10v7a5 5 0 0 1-10 0z M7 5H3v3q0 5 5 5 M17 5h4v3q0 5-5 5 M12 15v5 M8 21h8",
  gift: "M3 8h18v5H3z M5 13v8h14v-8 M12 8v13 M12 8C0 8 6-3 12 8c6-11 12 0 0 0",
  medal: "m8 3-2 6 6 4 6-4-2-6 M12 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10",
  settings:
    "m9 3-1 3-3 1-2 3 2 2-1 3 3 3 3-1 2 3 3-1 1-3 3-1 1-3-2-2 1-3-3-2-3 1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  arrow: "M4 12h15 M13 6l6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  back: "m15 5-7 7 7 7",
  heart: "M12 21S1 14 2 7c1-6 8-6 10-1 2-5 9-5 10 1 1 7-10 14-10 14z",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  lock: "M6 10h12v11H6z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3",
  play: "m8 4 13 8-13 8z",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12 M6 18 18 6",
  leaf: "M20 3C5 1 0 12 7 18c6 5 15-1 13-15z M5 21 16 8",
  sun: "M12 1v2 M12 21v2 M1 12h2 M21 12h2 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
  tree: "m12 2 7 9h-3l5 7H3l5-7H5z M12 18v4",
  gem: "m6 3-5 6 11 13L23 9l-5-6z M1 9h22 M6 3l6 19 6-19",
  waves: "M2 7q3-4 6 0t6 0 6 0 M2 13q3-4 6 0t6 0 6 0 M2 19q3-4 6 0t6 0 6 0",
  mountain: "m2 21 8-18 5 10 3-6 5 14z M7 10l3 2 2-3",
  flame: "M12 2C14 9 22 10 20 17c-3 9-18 4-16-3 1-3 4-4 4-8l3 6z",
  cloud: "M7 19h11c8 0 5-11-1-9C16 1 3 3 4 11c-5 1-3 8 3 8",
  crown: "m3 6 4 5 5-8 5 8 4-5-2 14H5z",
  clock: "M12 7v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  volume: "m11 3-6 5H2v8h3l6 5z M15 8q5 4 0 8 M18 4q9 8 0 16",
  user: "M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M3 22c0-12 18-12 18 0",
  flag: "M5 22V3q4-4 8 0t7 0v10q-3 4-7 0t-8 0",
  pause: "M8 5v14 M16 5v14",
  jump: "M12 21V3 M5 10l7-7 7 7",
  bolt: "m13 1-9 13h7l-1 9 10-14h-7z",
  shield: "m12 2 9 4v7q-1 6-9 9-8-3-9-9V6z",
  help: "M9 8c0-5 8-5 8 0 0 3-5 3-5 7 M12 19v1",
  logout: "M10 3H3v18h7 M9 12h13 M17 7l5 5-5 5",
};
export function Icon({
  name,
  size = 22,
  color = "#213D35",
  fill = "none",
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={paths[name] || paths.star}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={fill}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function Coin({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill="#EDB645" />
      <Circle
        cx="12"
        cy="12"
        r="7"
        stroke="#FFF0A9"
        strokeWidth="1.6"
        fill="none"
      />
      <Path
        d="M12 7v10"
        stroke="#FFF0A9"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
