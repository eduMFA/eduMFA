import { createTheme, type MantineColorsTuple } from "@mantine/core";

/** Brand blue derived from the former Bootstrap theme link colour (#337ab7). */
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

export const theme = createTheme({
  colors: { edumfa: edumfaBlue },
  // Clickable Mantine elements (badges inside buttons, checkboxes, selects)
  // get the pointer, like the former `[ng-click] { cursor: pointer }`.
  cursorType: "pointer",
  defaultRadius: "md",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  headings: { fontWeight: "600" },
  primaryColor: "edumfa",
  primaryShade: 6
});
