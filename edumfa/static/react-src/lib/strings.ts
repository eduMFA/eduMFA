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
