import { createContext, useContext, useCallback } from "react";
import * as Haptics from "expo-haptics";
export const FeedbackContext = createContext(true);
export function useButtonFeedback() {
  const enabled = useContext(FeedbackContext);
  return useCallback(() => {
    if (enabled)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => {},
      );
  }, [enabled]);
}
