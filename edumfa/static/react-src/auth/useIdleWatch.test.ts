import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIdleWatch } from "./useIdleWatch";

describe("useIdleWatch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down after the idle time and runs the timeout action", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleWatch({ enabled: true, idleSeconds: 2, onTimeout, warningSeconds: 3 })
    );

    expect(result.current).toBeNull();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBeNull();
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("cancels the countdown on activity", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleWatch({ enabled: true, idleSeconds: 1, onTimeout, warningSeconds: 5 })
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(4);

    act(() => {
      window.dispatchEvent(new Event("mousemove"));
    });
    expect(result.current).toBeNull();

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current).toBeNull();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleWatch({ enabled: false, idleSeconds: 1, onTimeout })
    );

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(result.current).toBeNull();
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
