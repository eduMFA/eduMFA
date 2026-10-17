import { NativeSelect, Textarea, TextInput } from "@mantine/core";

import type { SmsProviderParameter } from "@/api/servers";

export interface SmsProviderParameterFieldProps {
  name: string;
  onChange: (value: string) => void;
  parameter: SmsProviderParameter;
  value: string;
}

/**
 * One declared parameter of the selected provider module, rendered like the
 * legacy table row: a select for a fixed value list, a multi-line input for
 * `type: "text"`, a text input otherwise.
 */
export function SmsProviderParameterField({
  name,
  onChange,
  parameter,
  value
}: SmsProviderParameterFieldProps) {
  const id = `option_${name}`;
  const required = parameter.required === true;

  if (parameter.values) {
    return (
      <NativeSelect
        data={[{ label: "", value: "" }, ...parameter.values]}
        description={parameter.description}
        id={id}
        label={name}
        mb="sm"
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        required={required}
        value={value}
      />
    );
  }

  if (parameter.type === "text") {
    return (
      <Textarea
        autosize
        description={parameter.description}
        id={id}
        label={name}
        mb="sm"
        minRows={6}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        required={required}
        value={value}
      />
    );
  }

  return (
    <TextInput
      description={parameter.description}
      id={id}
      label={name}
      mb="sm"
      onChange={(event) => {
        onChange(event.currentTarget.value);
      }}
      required={required}
      value={value}
    />
  );
}
