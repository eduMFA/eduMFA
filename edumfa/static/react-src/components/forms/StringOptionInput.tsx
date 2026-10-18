import { TextInput } from "@mantine/core";

import { toText, wrapperOrder } from "./typedOptionHelpers";
import type { TypedOptionFieldProps } from "./TypedOptionInput";

/** The default input for `str`, `regexp` and untyped options: a text input. */
export function StringOptionInput({
  description,
  disabled,
  id,
  label,
  onChange,
  required,
  value
}: TypedOptionFieldProps) {
  return (
    <TextInput
      aria-label={label}
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
