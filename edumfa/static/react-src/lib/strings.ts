/**
 * Port of the legacy `capitalize` filter: upper-cases the first letter of
 * every word and lower-cases the rest.
 */
export function capitalize(input: string | null | undefined): string {
  if (!input) {
    return "";
  }

  return input.replace(
    /([^\W_]+[^\s-]*) */g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

/**
 * Turns a table filter into the "contains" pattern the legacy controllers
 * sent (`*value*`), unless the user typed `*` wildcards themselves, which are
 * passed through unchanged.
 */
export function toContainsWildcard(value: string): string {
  return value.includes("*") ? value : `*${value}*`;
}

/** Port of the legacy `truncate` filter: cuts long values and appends "...". */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}
