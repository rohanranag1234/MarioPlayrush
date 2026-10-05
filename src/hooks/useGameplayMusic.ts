import { useEffect } from "react";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";

export function useGameplayMusic(enabled: boolean) {
  const player = useAudioPlayer(require("../../assets/music/night-trail.wav"));
  useEffect(() => {
    let active = true;
    player.loop = true;
    player.volume = 0.32;
    if (enabled) {
      setAudioModeAsync({
        playsInSilentMode: false,
        shouldPlayInBackground: false,
        allowsRecording: false,
        interruptionMode: "mixWithOthers",
      })
        .then(() => {
          if (active) player.play();
        })
        .catch(() => {
          /* Audio availability never prevents local gameplay. */
        });
    } else player.pause();
    return () => {
      active = false;
      try {
        player.pause();
      } catch {
        /* Hook may already have released the player. */
      }
    };
  }, [enabled, player]);
}
