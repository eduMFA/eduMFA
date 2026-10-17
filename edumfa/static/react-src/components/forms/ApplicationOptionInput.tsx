import { Checkbox, NativeSelect, TextInput } from "@mantine/core";

import type { ApplicationOptionSpec } from "@/api/machines";
import { capitalize } from "@/lib/strings";

export interface ApplicationOptionInputProps {
  idPrefix: string;
  name: string;
  onChange: (value: boolean | string) => void;
  spec: ApplicationOptionSpec;
  value: boolean | string | undefined;
}

/**
 * One application option, rendered like the legacy template: a select when
 * the option lists allowed values, a checkbox for booleans, a text input
 * otherwise.
 */
export function ApplicationOptionInput({
  idPrefix,
  name,
  onChange,
  spec,
  value
}: ApplicationOptionInputProps) {
  const inputId = `${idPrefix}_${name}`;
  const label = capitalize(name);
  const textValue = typeof value === "string" ? value : "";
  const isChecked = value === true || value === "True" || value === "true";

  if (spec.value) {
    return (
      <NativeSelect
        data={[{ label: "", value: "" }, ...spec.value]}
        description={spec.description}
        id={inputId}
        label={label}
        mb="sm"
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        required={Boolean(spec.required)}
        value={textValue}
      />
    );
  }

  if (spec.type === "bool") {
    return (
      <Checkbox
        checked={isChecked}
        description={spec.description}
        id={inputId}
        label={label}
        mb="sm"
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
      />
    );
  }

  return (
    <TextInput
      description={spec.description}
      id={inputId}
      label={label}
      mb="sm"
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      required={Boolean(spec.required)}
      value={textValue}
    />
  );
}
