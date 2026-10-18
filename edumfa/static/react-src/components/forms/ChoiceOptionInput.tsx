import { NativeSelect } from "@mantine/core";

import { getChoiceName, toText, wrapperOrder } from "./typedOptionHelpers";
import type { TypedOptionChoice, TypedOptionFieldProps } from "./TypedOptionInput";

export interface ChoiceOptionInputProps extends TypedOptionFieldProps {
  choices: readonly TypedOptionChoice[];
}

/** An option that lists its allowed values: a select with an empty first entry. */
export function ChoiceOptionInput({
  choices,
  description,
  disabled,
  id,
  label,
  onChange,
  required,
  value
}: ChoiceOptionInputProps) {
  return (
    <NativeSelect
      aria-label={label}
      data={[
        { label: "", value: "" },
        ...choices.map((choice) => String(getChoiceName(choice)))
      ]}
      description={description}
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
