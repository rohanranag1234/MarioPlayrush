import React from "react";
import { G, Path, Ellipse, Circle, Rect } from "react-native-svg";
import { EnemyKind } from "../game/levels";

// Original, non-graphic monsters. The flat crown is the safe stomp surface;
// side horns, claws and red eyes make the threat readable at phone scale.
export function Monster({
  kind,
  size,
  hp,
  maxHp,
  facing,
}: {
  kind: EnemyKind;
  size: number;
  hp: number;
  maxHp: number;
  facing: number;
}) {
  const brute = kind === "brute",
    boss = kind === "boss",
    hunter = kind === "hunter";
  const body = boss
    ? "#603D56"
    : brute
      ? "#5C6555"
      : hunter
        ? "#5B4162"
        : "#596B45";
  return (
    <G transform={`scale(${size / 40})`}>
      <Ellipse cx={20} cy={39} rx={23} ry={4} fill="#24302655" />
      <G transform={facing < 0 ? "translate(40 0) scale(-1 1)" : undefined}>
        <Path
          d="M6 12-3 3 0 20 6 24 M34 12 43 3 40 20 34 24"
          fill="#D4B999"
          stroke="#45362F"
          strokeWidth={1.5}
        />
        <Path
          d="M4 34V16Q5 3 15 3H25Q35 3 36 16v18L30 39 24 35 17 39 10 35z"
          fill={body}
          stroke="#2A3031"
          strokeWidth={2}
        />
        {brute && (
          <Path
            d="M8 10 19 6 31 11 25 16 14 15z M12 28l8-5 8 5-8 7z"
            fill="#8B927C"
          />
        )}
        {hunter && (
          <Path d="M4 20-7 15-2 27-6 35 8 32 M32 32l14 5-4-13" fill="#3E2C43" />
        )}
        <Path d="m8 17 10 3-2 7-9-3z m14 3 11-4 1 8-10 3z" fill="#EE5943" />
        <Path d="M12 20v5 M28 20v5" stroke="#FCEE89" strokeWidth={2.3} />
        <Path d="m7 14 11 5 M23 19l12-6" stroke="#24272A" strokeWidth={3} />
        <Path d="M10 30q10-6 20 0v5H10z" fill="#221F24" />
        <Path d="m11 29 3 6 3-7 M23 28l3 7 3-6" fill="#F8DEB5" />
        <Path d="m6 36-3 5 9-2 M28 39l10 2-4-5" fill="#D9C4A1" />
        <Path d="m27 8-5 8 M24 8l2 3" stroke="#B37777" strokeWidth={1.4} />
        {boss && (
          <>
            <Path
              d="M7 7 1-9 12-3 20-13 28-3 39-9 33 7"
              fill="#463449"
              stroke="#261F2C"
              strokeWidth={2}
            />
            <Circle cx={20} cy={-3} r={3} fill="#F49144" />
          </>
        )}
      </G>
      {maxHp > 1 && (
        <>
          <Rect
            x={0}
            y={boss ? -23 : -8}
            width={40}
            height={4}
            rx={2}
            fill="#392A3A"
          />
          <Rect
            x={0}
            y={boss ? -23 : -8}
            width={(40 * hp) / maxHp}
            height={4}
            rx={2}
            fill="#EE7752"
          />
        </>
      )}
    </G>
  );
}
