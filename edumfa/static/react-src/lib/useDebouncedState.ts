import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";

export interface DebouncedState<TValue> {
  /** The value as applied to the consumer (e.g. the request parameters). */
  applied: TValue;
  /** Applies the draft now (or the given value), skipping the debounce. */
  apply: (value?: TValue) => void;
  /** The value as currently edited by the user. */
  draft: TValue;
  setDraft: Dispatch<SetStateAction<TValue>>;
}

/**
 * Keeps an edited "draft" value and a debounced "applied" copy of it, so a
 * filter form can update inputs instantly while the backend is only queried
 * once typing pauses. `apply()` (e.g. on Enter) bypasses the delay.
 */
export function useDebouncedState<TValue>(
  initialValue: TValue | (() => TValue),
  delayMs: number
): DebouncedState<TValue> {
  const [draft, setDraft] = useState<TValue>(initialValue);
  const [applied, setApplied] = useState<TValue>(initialValue);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setApplied(draft);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delayMs, draft]);

  const apply = useCallback(
    (value?: TValue) => {
      if (value !== undefined) {
        setDraft(value);
        setApplied(value);

        return;
      }

      setApplied(draft);
    },
    [draft]
  );

  return { applied, apply, draft, setDraft };
}
