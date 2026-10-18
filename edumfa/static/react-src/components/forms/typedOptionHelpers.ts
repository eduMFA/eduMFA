import type { TypedOptionChoice, TypedOptionValue } from "./TypedOptionInput";

/** Puts the help text under the input, like the legacy help block. */
export const wrapperOrder: ("label" | "input" | "description" | "error")[] = [
  "label",
  "input",
  "description",
  "error"
];

export function getChoiceName(choice: TypedOptionChoice): number | string {
  return typeof choice === "object" ? choice.name : choice;
}

/** Splits a stored "a, b" list the way the legacy controller ticked multi values. */
export function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function toList(value: TypedOptionValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  return typeof value === "string" ? splitCommaList(value) : [];
}

export function toText(value: TypedOptionValue | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  return typeof value === "number" ? String(value) : "";
}

export function toNumberInputValue(
  value: TypedOptionValue | undefined
): number | string {
  if (typeof value === "number") {
    return value;
  }

  return typeof value === "string" ? value : "";
}
