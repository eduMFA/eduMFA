import { type SerialLookupFields } from "./types";

/**
 * The query parameters of `GET /token/getserial/<otp>`; `countOnly` asks for
 * the number of candidate tokens instead of running the search.
 */
export function toSerialLookupParams(
  { assignment, countWindow, serialSubstring, tokenType }: SerialLookupFields,
  countOnly: boolean
): Record<string, number | string> {
  const params: Record<string, number | string> = {};

  if (tokenType) {
    params.type = tokenType;
  }

  if (assignment === "assigned") {
    params.assigned = 1;
  }

  if (assignment === "unassigned") {
    params.unassigned = 1;
  }

  if (serialSubstring.trim()) {
    params.serial = serialSubstring.trim();
  }

  if (countWindow.trim()) {
    params.window = Number(countWindow);
  }

  if (countOnly) {
    params.count = "1";
  }

  return params;
}
