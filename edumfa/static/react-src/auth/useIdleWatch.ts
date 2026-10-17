import { useEffect, useState } from "react";

export interface IdleWatchOptions {
  enabled: boolean;
  /** Seconds without activity before the warning countdown starts. */
  idleSeconds: number;
  /** Runs when the countdown reaches zero (lock screen or logout). */
  onTimeout: () => void;
  /** Length of the countdown shown as "You will be logged out in N second(s)". */
  warningSeconds?: number;
}

const activityEvents = ["click", "keydown", "mousemove", "scroll", "touchstart"];

/**
 * Port of the ng-idle setup (`IdleProvider.idle(logout_time - 10)`,
 * `IdleProvider.timeout(10)`): after `idleSeconds` without input a
 * countdown runs; any activity cancels it, and when it reaches zero the
 * session is locked or ended. Returns the remaining seconds while the
 * countdown runs, `null` otherwise.
 */
export function useIdleWatch({
  enabled,
  idleSeconds,
  onTimeout,
  warningSeconds = 10
}: IdleWatchOptions): number | null {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let countdownTimer: ReturnType<typeof setInterval> | null = null;

    const clearTimers = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }

      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    };
    const startCountdown = () => {
      let remaining = warningSeconds;

      setCountdown(remaining);
      countdownTimer = setInterval(() => {
        remaining -= 1;

        if (remaining <= 0) {
          clearTimers();
          setCountdown(null);
          onTimeout();

          return;
        }

        setCountdown(remaining);
      }, 1000);
    };
    const armIdleTimer = () => {
      idleTimer = setTimeout(startCountdown, Math.max(idleSeconds, 1) * 1000);
    };
    const handleActivity = () => {
      const wasCountingDown = countdownTimer !== null;

      clearTimers();
      armIdleTimer();

      if (wasCountingDown) {
        setCountdown(null);
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });
    armIdleTimer();

    return () => {
      clearTimers();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [enabled, idleSeconds, onTimeout, warningSeconds]);

  return enabled ? countdown : null;
}
