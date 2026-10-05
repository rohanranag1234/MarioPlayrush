import React from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { colors as c, fonts as f } from "../theme";
import { Icon, Coin } from "./Icon";
export function Button({
  children,
  onPress,
  secondary = false,
  icon,
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  icon?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        styles.button,
        secondary && styles.secondary,
        style,
        disabled && { opacity: 0.45 },
        (pressed || hovered) && {
          opacity: 0.86,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: c.ink }]}>
        {children}
      </Text>
      {icon && (
        <Icon name={icon} color={secondary ? c.ink : "white"} size={18} />
      )}
    </Pressable>
  );
}
export function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}
export function Title({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}
export function Body({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}
export function Stars({
  count = 0,
  size = 16,
}: {
  count?: number;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          color={n <= count ? "#E8B446" : "#DADFD5"}
          fill={n <= count ? "#E8B446" : "#DADFD5"}
          strokeWidth={1}
        />
      ))}
    </View>
  );
}
export function Currency({ amount }: { amount: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
      <Coin size={21} />
      <Text style={{ fontFamily: f.extra, color: c.ink, fontSize: 15 }}>
        {amount.toLocaleString()}
      </Text>
    </View>
  );
}
export function ProgressBar({
  value,
  color = c.green,
}: {
  value: number;
  color?: string;
}) {
  return (
    <View
      style={{
        height: 6,
        backgroundColor: "#E8ECE4",
        borderRadius: 5,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: 5,
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: c.green,
    borderRadius: 12,
    paddingHorizontal: 23,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    borderBottomWidth: 3,
    borderBottomColor: "#174C32",
  },
  secondary: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: c.border,
    borderBottomColor: c.border,
  },
  buttonText: { fontFamily: f.extra, color: "white", fontSize: 14 },
  label: {
    fontFamily: f.extra,
    fontSize: 10,
    letterSpacing: 1.8,
    color: c.muted,
  },
  title: { fontFamily: f.title, fontSize: 28, color: c.ink },
  body: { fontFamily: f.body, fontSize: 14, color: c.muted, lineHeight: 22 },
});
