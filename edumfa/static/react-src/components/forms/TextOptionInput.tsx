import { Textarea } from "@mantine/core";

import { toText, wrapperOrder } from "./typedOptionHelpers";
import type { TypedOptionFieldProps } from "./TypedOptionInput";

/** A `text` option: a textarea for longer values. */
export function TextOptionInput({
  description,
  disabled,
  id,
  label,
  onChange,
  required,
  value
}: TypedOptionFieldProps) {
  return (
    <Textarea
      aria-label={label}
      description={description}
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
