export type TokenFilterName =
  "description" | "rollout_state" | "serial" | "tokenrealm" | "type";

export type TokenFilters = Partial<Record<TokenFilterName, string>>;
