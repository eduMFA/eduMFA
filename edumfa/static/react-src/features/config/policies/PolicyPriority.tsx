import { useLingui } from "@lingui/react/macro";
import { NumberInput } from "@mantine/core";
import { useState } from "react";

/** Inline priority editor that saves on blur or Enter, and only for a valid, changed value. */
export function PolicyPriority({
  disabled,
  name,
  priority,
  onSave
}: {
  disabled: boolean;
  name: string;
  priority: number;
  onSave: (value: number) => void;
}) {
  const { t } = useLingui();
  const [value, setValue] = useState<number | string>(priority);
  const valid = typeof value === "number" && Number.isInteger(value) && value >= 1;
  return (
    <NumberInput
      allowDecimal={false}
      aria-label={t`Priority for ${name}`}
      disabled={disabled}
      error={!valid}
      min={1}
      value={value}
      onChange={setValue}
      w={90}
      size="xs"
      onBlur={() => {
        if (valid && value !== priority) onSave(value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}
