import {
  Checkbox,
  NativeSelect,
  NumberInput,
  Textarea,
  TextInput
} from "@mantine/core";
import type { ReactNode } from "react";

import { CheckboxPickList } from "./CheckboxPickList";
import { isConfigEnabled } from "@/api/config";

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

const wrapperOrder: ("label" | "input" | "description" | "error")[] = [
  "label",
  "input",
  "description",
  "error"
];

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
  const required = Boolean(spec.required);
  const help = description ?? spec.description;

  if (spec.type === "multi") {
    return (
      <CheckboxPickList
        columns={2}
        description={help}
        disabled={disabled}
        id={id}
        label={label}
        labelHidden
        onChange={onChange}
        options={(spec.value ?? []).map((choice) => String(getChoiceName(choice)))}
        required={required}
        selected={toList(value)}
      />
    );
  }

  if (spec.value !== undefined) {
    return (
      <NativeSelect
        aria-label={label}
        data={[
          { label: "", value: "" },
          ...spec.value.map((choice) => String(getChoiceName(choice)))
        ]}
        description={help}
        disabled={disabled}
        id={id}
        inputWrapperOrder={wrapperOrder}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        required={required}
        value={toText(value)}
      />
    );
  }

  if (spec.type === "bool") {
    return (
      <Checkbox
        aria-label={label}
        checked={isConfigEnabled(value)}
        description={help}
        disabled={disabled}
        id={id}
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
      />
    );
  }

  if (spec.type === "text") {
    return (
      <Textarea
        aria-label={label}
        description={help}
        disabled={disabled}
        id={id}
        inputWrapperOrder={wrapperOrder}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        required={required}
        rows={6}
        value={toText(value)}
      />
    );
  }

  if (spec.type === "int") {
    return (
      <NumberInput
        allowDecimal={false}
        aria-label={label}
        description={help}
        disabled={disabled}
        id={id}
        inputWrapperOrder={wrapperOrder}
        onChange={onChange}
        required={required}
        value={toNumberInputValue(value)}
      />
    );
  }

  return (
    <TextInput
      aria-label={label}
      description={help}
      disabled={disabled}
      id={id}
      inputWrapperOrder={wrapperOrder}
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      required={required}
      value={toText(value)}
    />
  );
}

function getChoiceName(choice: TypedOptionChoice): number | string {
  return typeof choice === "object" ? choice.name : choice;
}

/** Splits a stored "a, b" list the way the legacy controller ticked multi values. */
export function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
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

function toList(value: TypedOptionValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  return typeof value === "string" ? splitCommaList(value) : [];
}

function toText(value: TypedOptionValue | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  return typeof value === "number" ? String(value) : "";
}

function toNumberInputValue(value: TypedOptionValue | undefined): number | string {
  if (typeof value === "number") {
    return value;
  }

  return typeof value === "string" ? value : "";
}
