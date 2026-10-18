import { useLingui } from "@lingui/react/macro";
import { Checkbox, NativeSelect, Textarea, TextInput } from "@mantine/core";
import type { ChangeEvent } from "react";

import { getResolverFieldError, type ResolverField } from "./resolverFields";
import { toText } from "./resolverTypes";

export interface ResolverFieldInputProps {
  field: ResolverField;
  onChange: (value: boolean | string) => void;
  /** The current value of the field; checkboxes hold booleans. */
  value: boolean | string | undefined;
}

/** One field of a connection-based resolver: checkbox, select, textarea or text input. */
export function ResolverFieldInput({
  field,
  onChange,
  value: rawValue
}: ResolverFieldInputProps) {
  const { t } = useLingui();
  const value = toText(rawValue);
  const error = value ? getResolverFieldError(field, rawValue) : null;
  const describeError = (): string | undefined => {
    switch (error) {
      case "json":
        return t`Enter a valid JSON object.`;
      case "url":
        return t`Enter an HTTP or HTTPS URL.`;
      default:
        return undefined;
    }
  };
  const inputProps = {
    id: `resolver-${field.key}`,
    label: field.label,
    required: field.required ?? false,
    value,
    onChange: (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      onChange(event.currentTarget.value);
    },
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    error: describeError()
  };
  if (field.kind === "checkbox")
    return (
      <Checkbox
        checked={rawValue === true}
        label={field.label}
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
      />
    );
  if (field.options) {
    const known = field.options.some(
      (option) => (typeof option === "string" ? option : option.value) === value
    );
    return (
      <NativeSelect
        {...inputProps}
        data={known ? field.options : [value, ...field.options]}
      />
    );
  }
  if (field.kind === "textarea" || field.kind === "json")
    return <Textarea {...inputProps} rows={3} />;
  return (
    <TextInput
      {...inputProps}
      autoComplete={field.kind === "password" ? "new-password" : "off"}
      type={field.kind === "password" ? "password" : "text"}
    />
  );
}
