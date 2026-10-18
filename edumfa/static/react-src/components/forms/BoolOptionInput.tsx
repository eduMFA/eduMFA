import { Checkbox } from "@mantine/core";

import type { TypedOptionFieldProps } from "./TypedOptionInput";
import { isConfigEnabled } from "@/api/config";

/** A `bool` option: a checkbox that reads the stored value like the config flags. */
export function BoolOptionInput({
  description,
  disabled,
  id,
  label,
  onChange,
  value
}: TypedOptionFieldProps) {
  return (
    <Checkbox
      aria-label={label}
      checked={isConfigEnabled(value)}
      description={description}
      disabled={disabled}
      id={id}
      onChange={(event) => {
        onChange(event.currentTarget.checked);
      }}
    />
  );
}
