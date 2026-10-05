import AsyncStorage from "@react-native-async-storage/async-storage";
import { Progress, initialProgress } from "./progress";
import { parseProgress } from "./parseProgress";
const KEY = "@rusty-run/progress-v1";
export const localProgressService = {
  async load(): Promise<Progress> {
    const data = await AsyncStorage.getItem(KEY);
    if (!data) return initialProgress();
    return parseProgress(data);
  },
  async save(progress: Progress) {
    await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  },
  async delete() {
    await AsyncStorage.removeItem(KEY);
  },
};
