import { CheckboxPickList } from "./CheckboxPickList";
import { getChoiceName, toList } from "./typedOptionHelpers";
import type { TypedOptionChoice, TypedOptionFieldProps } from "./TypedOptionInput";

export interface MultiOptionInputProps extends TypedOptionFieldProps {
  choices: readonly TypedOptionChoice[];
}

/** A `multi` option: a checkbox group holding a comma separated list. */
export function MultiOptionInput({
  choices,
  description,
  disabled,
  id,
  label,
  onChange,
  required,
  value
}: MultiOptionInputProps) {
  return (
    <CheckboxPickList
      columns={2}
      description={description}
      disabled={disabled}
      id={id}
      label={label}
      labelHidden
      onChange={onChange}
      options={choices.map((choice) => String(getChoiceName(choice)))}
      required={required}
      selected={toList(value)}
    />
  );
}
