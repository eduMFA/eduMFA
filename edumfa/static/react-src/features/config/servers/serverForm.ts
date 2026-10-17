/**
 * Shared pieces of the server definition forms (SMTP, RADIUS, eduMFA):
 * the legacy identifier patterns from `resourceNamePatterns` and the
 * conversions between API values and Mantine inputs.
 */

/** Legacy `resourceNamePatterns.withoutTestEmail`: a definition must not shadow the test endpoint. */
export const SMTP_IDENTIFIER_PATTERN = /^(?!send_test_email$)([A-Za-z0-9_.-]+)$/;

/** Legacy `resourceNamePatterns.withoutTestRequest` for RADIUS and eduMFA servers. */
export const TEST_REQUEST_IDENTIFIER_PATTERN = /^(?!test_request$)([a-zA-Z0-9_.-]+)$/;

/** Value of a Mantine `NumberInput`: "" while the field is empty. */
export type NumberFieldValue = number | string;

/**
 * Turns a number field into its request value: the integer when set,
 * `undefined` when empty so the backend applies its default instead of
 * failing on `int("")` like it did for a cleared legacy input.
 */
export function toOptionalInteger(value: NumberFieldValue): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value.trim() || Number.NaN);

  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

/** Missing or `null` API strings become "" for the inputs. */
export function toText(value: string | null | undefined): string {
  return value ?? "";
}

/** Missing or `null` API numbers leave the `NumberInput` empty. */
export function toNumberField(value: number | null | undefined): NumberFieldValue {
  return value ?? "";
}
