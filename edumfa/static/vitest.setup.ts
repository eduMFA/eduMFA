import "@testing-library/jest-dom/vitest";
import { notifications } from "@mantine/notifications";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Browser APIs Mantine components rely on but jsdom does not implement.
const { getComputedStyle } = window;
window.getComputedStyle = (element) => getComputedStyle(element);
window.HTMLElement.prototype.scrollIntoView = () => {};

Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn()
  })),
  writable: true
});

class ResizeObserverStub {
  disconnect() {}
  observe() {}
  unobserve() {}
}

window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
  notifications.clean();
});
