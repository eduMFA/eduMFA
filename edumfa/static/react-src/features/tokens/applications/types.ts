export type ApplicationName = "offline" | "ssh";

export type ApplicationFilterName =
  "count" | "rounds" | "serial" | "service_id" | "user";

export type ApplicationFilters = Partial<Record<ApplicationFilterName, string>>;
