import { NumberInput } from "@mantine/core";

import { toNumberInputValue, wrapperOrder } from "./typedOptionHelpers";
import type { TypedOptionFieldProps } from "./TypedOptionInput";

/** An `int` option: a whole-number input (the legacy template had none). */
export function IntOptionInput({
  description,
  disabled,
  id,
  label,
  onChange,
  required,
  value
}: TypedOptionFieldProps) {
  return (
    <NumberInput
      allowDecimal={false}
      aria-label={label}
      description={description}
      disabled={disabled}
      id={id}
      inputWrapperOrder={wrapperOrder}
      onChange={onChange}
      required={required}
      value={toNumberInputValue(value)}
    />
  );
}
