import AsyncStorage from "@react-native-async-storage/async-storage";
import { Progress, initialProgress } from "./progress";
const KEY = "@rusty-run/progress-v1";
export const localProgressService = {
  async load(): Promise<Progress> {
    const data = await AsyncStorage.getItem(KEY);
    if (!data) return initialProgress();
    const parsed = JSON.parse(data);
    if (
      parsed.version !== 1 ||
      !parsed.levels ||
      typeof parsed.coins !== "number"
    )
      throw new Error("Your saved adventure could not be read.");
    return {
      ...initialProgress(),
      ...parsed,
      settings: { ...initialProgress().settings, ...parsed.settings },
    };
  },
  async save(progress: Progress) {
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  },
  async delete() {
    await AsyncStorage.removeItem(KEY);
  },
};
