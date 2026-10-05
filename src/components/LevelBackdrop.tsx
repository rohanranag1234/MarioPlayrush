import React, { memo } from "react";
import Svg, {
  Rect,
  Path,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { World } from "../game/levels";
const moods = [
  ["#DDEED8", "#A0BB88", "#65895E"],
  ["#F5DFC1", "#D2A474", "#9E795D"],
  ["#D1E3D9", "#68947C", "#3D675D"],
  ["#C5BDDE", "#807293", "#4E456F"],
  ["#CFEBEB", "#7EAAAE", "#52768C"],
  ["#E1ECF5", "#AABBCB", "#7A92A9"],
  ["#E7B9A5", "#B37E71", "#754951"],
  ["#DCE5FA", "#A2ABD0", "#787FAD"],
  ["#D3D8CF", "#909D97", "#5D7374"],
  ["#C6B8D0", "#89728E", "#554362"],
];
export const LevelBackdrop = memo(function LevelBackdrop({
  world,
  variant,
}: {
  world: World;
  variant: number;
}) {
  const [sky, far, near] = moods[world.id - 1];
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 900 440"
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <LinearGradient id="levelSky" x2="0" y2="1">
          <Stop offset="0" stopColor={sky} />
          <Stop offset="1" stopColor={world.color} />
        </LinearGradient>
      </Defs>
      <Rect width={900} height={440} fill="url(#levelSky)" />
      <Circle
        cx={680 - variant * 135}
        cy={88 + variant * 9}
        r={35}
        fill={variant % 2 ? "#FAE1B8" : "#FFEDBA"}
        opacity={0.85}
      />
      <Path
        d={`M0 280 110 ${110 + variant * 18} 240 285 390 ${150 - variant * 12} 530 270 720 ${100 + variant * 20} 900 280V440H0z`}
        fill={far}
      />
      <Path
        d={`M0 340Q130 ${220 + variant * 15} 260 320T520 280T900 310V440H0z`}
        fill={near}
        opacity={0.65}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <G
          key={i}
          transform={`translate(${i * 120 - 30} ${310 + (i % 3) * 15})`}
          opacity={0.45}
        >
          {world.id === 9 || world.id === 10 ? (
            <Path
              d="M-30 0v-100h15v-20h15v20h25V0z M-20-95v-25h10v25"
              fill={near}
            />
          ) : world.id === 2 ? (
            <Path
              d="M-8 0v-95q8-20 16 0V0 M-8-30q-30 0-30-25v-20h12v20q0 12 20 12"
              fill={near}
            />
          ) : world.id === 4 || world.id === 6 ? (
            <Path d="m-30 0 14-95L4-65 11-115 32 0z" fill={near} />
          ) : (
            <Path
              d="M-5 0h10v-25h25L5-65h17L0-125-23-65h17l-25 40h26z"
              fill={near}
            />
          )}
        </G>
      ))}
      <Rect y={410} width={900} height={30} fill={near} opacity={0.2} />
    </Svg>
  );
});
