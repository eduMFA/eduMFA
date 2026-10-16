import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedState } from "./useDebouncedState";

describe("useDebouncedState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies the draft after the delay", () => {
    const { result } = renderHook(() => useDebouncedState("", 300));

    act(() => {
      result.current.setDraft("ali");
    });

    expect(result.current.draft).toBe("ali");
    expect(result.current.applied).toBe("");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.applied).toBe("ali");
  });

  it("applies immediately on demand and accepts a replacement value", () => {
    const { result } = renderHook(() => useDebouncedState("", 300));

    act(() => {
      result.current.setDraft("ali");
    });
    act(() => {
      result.current.apply();
    });

    expect(result.current.applied).toBe("ali");

    act(() => {
      result.current.apply("");
    });

    expect(result.current.draft).toBe("");
    expect(result.current.applied).toBe("");
  });
});
