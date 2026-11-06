import { useEffect, useState } from "react";

import {
  getAudioSettings,
  loadAudioSettings,
  playSound,
  subscribeAudio,
  updateAudioSettings,
  type AudioSettings,
} from "@/lib/minako/sound";

let loaded = false;

export function useAudioSettings(): [AudioSettings, (patch: Partial<AudioSettings>) => void] {
  const [s, setS] = useState<AudioSettings>(getAudioSettings());
  useEffect(() => {
    if (!loaded) {
      loaded = true;
      loadAudioSettings();
    }
    setS(getAudioSettings());
    return subscribeAudio(setS);
  }, []);
  return [s, updateAudioSettings];
}

export { playSound };
