import { useEffect, useState } from "react";

/**
 * Returns `value` once it has stopped changing for `delayMs`. Used for live
 * lookups that replace the legacy `typeahead-wait-ms` behavior.
 */
export function useDebouncedValue<TValue>(value: TValue, delayMs = 150): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delayMs, value]);

  return debouncedValue;
}
