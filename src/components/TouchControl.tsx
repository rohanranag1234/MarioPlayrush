import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  GestureResponderEvent,
  findNodeHandle,
} from "react-native";
import { updateTouches } from "../game/touchInput";
import { useButtonFeedback } from "./Feedback";
import { Icon } from "./Icon";
import { colors } from "../theme";

// Raw per-touch events let one thumb hold movement while the other jumps.
// A Pressable responder can surrender a held direction to the second thumb.
export function TouchControl({
  icon,
  label,
  large,
  onChange,
}: {
  icon: string;
  label: string;
  large: boolean;
  onChange: (held: boolean) => void;
}) {
  const feedback = useButtonFeedback();
  const view = useRef<View>(null);
  const touches = useRef(new Set<string>());
  const [held, setHeld] = useState(false);
  const change = (event: GestureResponderEvent, down: boolean) => {
    const wasHeld = touches.current.size > 0;
    touches.current = updateTouches(
      touches.current,
      event.nativeEvent.changedTouches,
      down,
      findNodeHandle(view.current),
    );
    const active = touches.current.size > 0;
    onChange(active);
    if (active && !wasHeld) feedback();
    setHeld(active);
  };
  return (
    <View
      ref={view}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      onTouchStart={(event) => change(event, true)}
      onTouchEnd={(event) => change(event, false)}
      onTouchCancel={() => {
        touches.current.clear();
        setHeld(false);
        onChange(false);
      }}
      style={[styles.button, large && styles.large, held && styles.held]}
    >
      <View pointerEvents="none">
        <Icon name={icon} size={30} color={colors.green} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    height: 62,
    width: 68,
    borderRadius: 20,
    backgroundColor: "#F9FBE8E6",
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: "#C5D6B3",
    alignItems: "center",
    justifyContent: "center",
  },
  large: { height: 74, width: 80 },
  held: { backgroundColor: "#CDE3B5", borderBottomWidth: 2 },
});
