import { useEffect } from "react";

export interface IdleTimeoutOptions {
  enabled: boolean;
  onIdle: () => void;
  timeoutMs: number;
}

const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];

export function useIdleTimeout({
  enabled,
  onIdle,
  timeoutMs
}: IdleTimeoutOptions): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(onIdle, timeoutMs);
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });
    resetTimer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [enabled, onIdle, timeoutMs]);
}
