/**
 * The legacy `resourceNamePatterns.withoutTest`: `/machineresolver/test` is
 * an endpoint of its own, so a resolver must not be called "test".
 */
export const machineResolverNamePattern = /^(?!test$)([A-Za-z0-9_.-]+)$/;

/** A stored config value as input text; missing and non-text values read as "". */
export function readText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}
