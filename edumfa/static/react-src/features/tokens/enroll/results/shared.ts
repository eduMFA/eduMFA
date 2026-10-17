/** The backend prefixes the seed with `seed://`; the legacy UI showed it raw. */
export function stripSeedPrefix(value: string | undefined): string {
  return (value ?? "").replace(/^seed:\/\//, "");
}
