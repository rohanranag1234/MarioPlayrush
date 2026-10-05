import React from "react";
import Svg, {
  G,
  Path,
  Ellipse,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

export function FoxShape({ color = "#E98346" }: { color?: string }) {
  return (
    <G>
      <Path
        d="M104 149C179 191 210 128 204 103c-10 14-26 20-43 23l-20-21-29 22z"
        fill={color}
      />
      <Path
        d="M179 160c21-13 29-35 25-57-10 14-26 20-43 23l15 10-7 6z"
        fill="#FFF5D9"
      />
      <Path
        d="m76 164-11 22 17 7 23-29 M119 165l11 28 20-5-5-24"
        fill="#593E32"
      />
      <Path d="M67 133c-8 23 0 46 36 48 44 1 53-24 31-55z" fill={color} />
      <Ellipse cx="105" cy="148" rx="23" ry="25" fill="#FFF1D5" />
      <Path
        d="M72 127 47 155q-8 17 9 16l33-25 M133 123l20 20q16 3 15-11l-28-27"
        fill={color}
      />
      <Path
        d="M57 71 49 14q0-8 9-2l36 31 M111 43l37-32q9-7 8 3l-5 59"
        fill={color}
      />
      <Path d="m63 50-6-27 24 22 M124 46l23-23-1 30" fill="#744636" />
      <Path
        d="M53 65q-1-33 53-30 47 0 51 34l12 18-15 1 9 12-19 2c-20 37-73 30-93-1l-14-5 14-10-10-6z"
        fill={color}
      />
      <Path
        d="M50 89c22-15 33 2 55 12 21-15 36-26 52-13-3 30-38 47-54 45-19-1-43-16-53-44z"
        fill="#FFF5DD"
      />
      <Path d="M97 100q8-7 16 0l-8 9z" fill="#303B30" />
      <Path
        d="M105 109v6q-7 5-12 0 M105 115q7 4 12-2"
        fill="none"
        stroke="#714B37"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Ellipse cx="79" cy="79" rx="4.5" ry="7" fill="#2D3D32" />
      <Ellipse cx="130" cy="78" rx="4.5" ry="7" fill="#2D3D32" />
      <Circle cx="80" cy="76" r="1.6" fill="white" />
      <Circle cx="131" cy="75" r="1.6" fill="white" />
      <Ellipse cx="64" cy="93" rx="8" ry="4" fill="#E9B790" />
      <Ellipse cx="143" cy="92" rx="8" ry="4" fill="#E9B790" />
      <Path d="M74 126q32 12 66-5l-4 18q-35 14-62 0z" fill="#376C49" />
      <Path d="m133 130 29 16-15 4 1 13-28-24z" fill="#376C49" />
    </G>
  );
}
export function Fox({ size = 100, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="20 0 200 210">
      <FoxShape color={color} />
    </Svg>
  );
}
function Pine({
  x,
  y,
  s = 1,
  color = "#608E60",
}: {
  x: number;
  y: number;
  s?: number;
  color?: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M-4 0h8v-95h-8" fill="#7B7952" />
      <Path
        d="M0-160-40-95h17l-34 47h25l-32 41H64L32-48h25L23-95h17z"
        fill={color}
      />
    </G>
  );
}
export function Landscape({
  world = 1,
  hero = false,
}: {
  world?: number;
  hero?: boolean;
}) {
  const desert = world === 2,
    jungle = world === 3,
    snow = world === 6;
  const sky = desert
    ? "#FAEAC9"
    : jungle
      ? "#D8E8DF"
      : snow
        ? "#E0EEF2"
        : world > 3
          ? "#E0DFF0"
          : "#E6F0DD";
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 720 340"
      preserveAspectRatio="xMidYMid slice"
    >
      <Rect width="720" height="340" fill={sky} />
      <Circle cx="568" cy="78" r="41" fill={desert ? "#F4C969" : "#F7F5CD"} />
      <G fill="#FFFDF1" opacity=".65">
        <Path d="M77 81c-1-18 24-24 34-12 17-24 49-11 49 9 25-5 30 17 21 22H66c-12-6-5-20 11-19" />
        <Path d="M381 51c-1-12 16-17 24-8 15-18 39-7 38 8 25-3 23 12 15 15h-87c-5-8-1-14 10-15" />
      </G>
      <Path
        d="M0 228Q105 164 184 178T342 133Q426 94 507 151T720 118V340H0z"
        fill={desert ? "#E9CF91" : jungle ? "#A3C1AB" : "#BFD5AD"}
      />
      <Path
        d="M0 216q89-48 178 12t213-3 176-24 153-2v141H0z"
        fill={desert ? "#E6C181" : jungle ? "#7EAA91" : "#9FBF8B"}
      />
      {desert ? (
        <G fill="#9FA66D">
          <Path d="M560 263v-92q0-20 15-20t15 20v92z M558 224q-43 0-43-30v-26h15v23q0 15 30 15 M589 204q40 0 40-30v-28h-15v25q0 15-25 15" />
          <Path d="M183 265v-63q0-16 13-16t13 16v63z M184 234q-30 0-30-20v-18h12v18q0 10 20 10" />
        </G>
      ) : (
        <G>
          <Pine
            x={125}
            y={282}
            s={0.85}
            color={jungle ? "#649C7C" : "#8AAE77"}
          />
          <Pine
            x={634}
            y={282}
            s={1.25}
            color={jungle ? "#568D70" : "#7C9F68"}
          />
          <Pine x={565} y={256} s={0.65} color="#92AF80" />
          <Pine x={41} y={300} s={1.15} color="#739768" />
        </G>
      )}
      <Path
        d="M0 294q103-58 213-16t244-10 263 16v56H0z"
        fill={desert ? "#DDB375" : jungle ? "#57846B" : "#73985D"}
      />
      <Path
        d="M0 315q100-30 231-10t259-13 230 23v25H0z"
        fill={desert ? "#CDA06C" : jungle ? "#447259" : "#547D4A"}
      />
      <G fill={desert ? "#E7C787" : "#8FA968"}>
        <Ellipse cx="205" cy="307" rx="32" ry="17" />
        <Ellipse cx="231" cy="310" rx="26" ry="20" />
        <Ellipse cx="668" cy="316" rx="55" ry="21" />
      </G>
      <G fill="#F7EDB0">
        <Circle cx="94" cy="302" r="3" />
        <Circle cx="105" cy="296" r="3" />
        <Circle cx="291" cy="319" r="3" />
        <Circle cx="281" cy="314" r="3" />
        <Circle cx="552" cy="304" r="3" />
      </G>
      {hero && (
        <G>
          <Ellipse
            cx="422"
            cy="302"
            rx="91"
            ry="13"
            fill="#365D39"
            opacity=".18"
          />
          <G transform="translate(302 57) rotate(-8 100 100) scale(1.18)">
            <FoxShape />
          </G>
          <G fill="#EFC25A" stroke="#FAE6A2" strokeWidth="3">
            <Ellipse
              cx="303"
              cy="93"
              rx="10"
              ry="14"
              transform="rotate(-20 303 93)"
            />
            <Ellipse
              cx="552"
              cy="174"
              rx="11"
              ry="15"
              transform="rotate(18 552 174)"
            />
          </G>
          <Path
            d="m511 88 3 9 9 3-9 3-3 9-3-9-9-3 9-3z M277 177l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"
            fill="#FAFBDA"
          />
        </G>
      )}
      {hero && (
        <>
          <Defs>
            <LinearGradient id="edgeFade" x1="0%" x2="100%">
              <Stop offset="0%" stopColor={sky} />
              <Stop offset="100%" stopColor={sky} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="125" height="340" fill="url(#edgeFade)" />
        </>
      )}
    </Svg>
  );
}
