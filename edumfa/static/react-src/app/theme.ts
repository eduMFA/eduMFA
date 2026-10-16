import { createTheme, type MantineColorsTuple } from "@mantine/core";

/** Brand blue derived from the legacy Bootstrap theme link colour (#337ab7). */
const edumfaBlue: MantineColorsTuple = [
  "#e8f0fb",
  "#d1e0f5",
  "#a5c3ea",
  "#77a5de",
  "#5089d2",
  "#3a77c8",
  "#2b6cb0",
  "#245c97",
  "#1e4e80",
  "#173f69"
];

/**
 * Mantine theme for React-owned routes. Angular views keep Bootstrap 3, so
 * nothing here leaks outside `#react-root` except the CSS variables, which
 * are inert on their own.
 */
export const theme = createTheme({
  colors: { edumfa: edumfaBlue },
  defaultRadius: "md",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: { fontWeight: "600" },
  primaryColor: "edumfa",
  primaryShade: 6,
  // Bootstrap 3 sets `html { font-size: 10px }`; Mantine sizes in rem assume
  // 16px, so everything is scaled back up to its intended size.
  scale: 1.6
});
