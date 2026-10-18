import type { ReactNode } from "react";

import { BoolOptionInput } from "./BoolOptionInput";
import { ChoiceOptionInput } from "./ChoiceOptionInput";
import { IntOptionInput } from "./IntOptionInput";
import { MultiOptionInput } from "./MultiOptionInput";
import { StringOptionInput } from "./StringOptionInput";
import { TextOptionInput } from "./TextOptionInput";

export type TypedOptionChoice = number | string | { name: string };

/** What an option input holds: lists come from `multi` entries, numbers from `int`. */
export type TypedOptionValue = boolean | number | string | string[];

/** The option description handler modules and task modules deliver. */
export interface TypedOptionSpec {
  description?: string | undefined;
  required?: boolean | undefined;
  type?: string | undefined;
  value?: readonly TypedOptionChoice[] | undefined;
}

export interface TypedOptionInputProps {
  /** Shown under the input like the legacy help block; defaults to the spec description. */
  description?: ReactNode;
  disabled?: boolean | undefined;
  id: string;
  /** Accessible name; the surrounding table shows the option name as text. */
  label: string;
  onChange: (value: TypedOptionValue) => void;
  spec: TypedOptionSpec;
  value: TypedOptionValue | undefined;
}

/** What the per-type inputs receive once `TypedOptionInput` resolved the defaults. */
export interface TypedOptionFieldProps {
  description: ReactNode;
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: TypedOptionValue) => void;
  required: boolean;
  value: TypedOptionValue | undefined;
}

/**
 * Port of the input switch of `config.events.details.html` and
 * `config.periodictasks.details.html`: a checkbox group for `multi`, a
 * select when the option lists allowed values, a checkbox for `bool`, a
 * textarea for `text`, a number input for `int` (the legacy template had no
 * input for it) and a text input otherwise (`str`, `regexp`).
 */
export function TypedOptionInput({
  description,
  disabled = false,
  id,
  label,
  onChange,
  spec,
  value
}: TypedOptionInputProps) {
  const field: TypedOptionFieldProps = {
    description: description ?? spec.description,
    disabled,
    id,
    label,
    onChange,
    required: Boolean(spec.required),
    value
  };

  if (spec.type === "multi") {
    return <MultiOptionInput {...field} choices={spec.value ?? []} />;
  }

  if (spec.value !== undefined) {
    return <ChoiceOptionInput {...field} choices={spec.value} />;
  }

  if (spec.type === "bool") {
    return <BoolOptionInput {...field} />;
  }

  if (spec.type === "text") {
    return <TextOptionInput {...field} />;
  }

  if (spec.type === "int") {
    return <IntOptionInput {...field} />;
  }

  return <StringOptionInput {...field} />;
}

/** A required option counts as filled unless it is empty text or an empty list. */
export function hasOptionValue(value: TypedOptionValue | undefined): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

/** Lists go to the backend comma separated, like the legacy multi-select output. */
export function toOptionRequestValue(
  value: TypedOptionValue
): boolean | number | string {
  return Array.isArray(value) ? value.join(",") : value;
}
