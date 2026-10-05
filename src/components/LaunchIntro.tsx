import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fox } from "./Art";
import { Icon } from "./Icon";
import { colors as c, fonts as f } from "../theme";

const INTRO_DURATION_MS = 2500;

export function LaunchIntro({
  ready,
  fontsReady,
  reducedMotion,
  onFinish,
}: {
  ready: boolean;
  fontsReady: boolean;
  reducedMotion: boolean;
  onFinish: () => void;
}) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const [systemReducedMotion, setSystemReducedMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setSystemReducedMotion(value);
      })
      .catch(() => {
        /* Keep the gentle fade if the setting is unavailable. */
      });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemReducedMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: INTRO_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) finishRef.current();
    });
    return () => animation.stop();
  }, [ready, progress]);

  const gentle = reducedMotion || systemReducedMotion;
  const overlayOpacity = progress.interpolate({
    inputRange: [0, 0.86, 1],
    outputRange: [1, 1, 0],
  });
  const contentOpacity = ready
    ? progress.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 1, 1] })
    : 1;
  const scale = progress.interpolate({
    inputRange: [0, 0.24, 0.36, 1],
    outputRange: [0.8, 1.04, 1, 1],
  });
  const rise = progress.interpolate({
    inputRange: [0, 0.3, 0.44, 0.58, 0.72, 1],
    outputRange: [28, 0, -9, 0, -6, 0],
  });
  const titleRise = progress.interpolate({
    inputRange: [0, 0.2, 0.38, 1],
    outputRange: [16, 16, 0, 0],
  });

  return (
    <Animated.View
      style={[
        s.overlay,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          opacity: overlayOpacity,
        },
      ]}
      onStartShouldSetResponder={() => true}
      accessibilityViewIsModal
      accessible
      accessibilityLabel="Run for Life. Your adventure is about to begin."
    >
      <View style={s.sun} />
      <View style={s.hill} />
      <Animated.View style={[s.content, { opacity: contentOpacity }]}>
        <Animated.View
          style={[
            s.foxCircle,
            !gentle &&
              ready && { transform: [{ translateY: rise }, { scale }] },
          ]}
        >
          <View style={s.sparkleLeft}>
            <Icon name="star" color={c.yellow} fill={c.yellow} size={22} />
          </View>
          <Fox size={180} />
          <View style={s.sparkleRight}>
            <Icon name="leaf" color="#86A76F" size={26} />
          </View>
        </Animated.View>
        <Animated.View
          style={[
            s.wordmark,
            !gentle && ready && { transform: [{ translateY: titleRise }] },
          ]}
        >
          <Text style={[s.title, fontsReady && { fontFamily: f.title }]}>
            Run for <Text style={{ color: c.orange }}>Life</Text>
          </Text>
          <Text style={[s.tagline, fontsReady && { fontFamily: f.bold }]}>
            SMALL PAWS. ENDLESS ADVENTURE.
          </Text>
        </Animated.View>
        <View style={s.dots}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                s.dot,
                {
                  opacity: ready
                    ? progress.interpolate({
                        inputRange: [
                          0,
                          0.2 + index * 0.12,
                          0.4 + index * 0.12,
                          1,
                        ],
                        outputRange: [0.25, 0.25, 1, 1],
                      })
                    : 0.4,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
      <Text
        style={[
          s.footer,
          { bottom: insets.bottom + 24 },
          fontsReady && { fontFamily: f.body },
        ]}
      >
        {ready
          ? "A new adventure starts with you."
          : "Getting your adventure ready…"}
      </Text>
    </Animated.View>
  );
}
const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    backgroundColor: "#E9F1E1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: {
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 20,
    width: "100%",
  },
  foxCircle: {
    height: 220,
    width: 220,
    borderRadius: 110,
    backgroundColor: "#F7F8ECCC",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleLeft: { position: "absolute", left: -12, top: 50 },
  sparkleRight: { position: "absolute", right: -13, bottom: 46 },
  wordmark: { alignItems: "center", gap: 12 },
  title: { fontSize: 43, color: c.ink, textAlign: "center", fontWeight: "600" },
  tagline: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#79916B",
    textAlign: "center",
  },
  sun: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFF2C066",
    right: -35,
    top: 65,
  },
  hill: {
    position: "absolute",
    width: 650,
    height: 400,
    borderRadius: 325,
    backgroundColor: "#DCE8D166",
    bottom: -275,
    left: -120,
  },
  dots: { flexDirection: "row", gap: 8, marginTop: 4 },
  dot: { height: 7, width: 7, borderRadius: 4, backgroundColor: c.green },
  footer: {
    position: "absolute",
    bottom: 48,
    color: "#7E9272",
    fontSize: 12,
    textAlign: "center",
  },
});
