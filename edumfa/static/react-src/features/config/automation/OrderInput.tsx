import { useLingui } from "@lingui/react/macro";
import { NumberInput } from "@mantine/core";
import { useState } from "react";

/** Inline order editor that saves on blur or Enter, and only for a valid, changed value. */
export function OrderInput({
  name,
  value,
  disabled,
  onSave
}: {
  name: string;
  value: number;
  disabled: boolean;
  onSave: (value: number) => void;
}) {
  const { t } = useLingui();
  const [order, setOrder] = useState<string | number>(value);

  const valid = typeof order === "number" && Number.isInteger(order) && order >= 0;
  return (
    <NumberInput
      aria-label={t`Order for ${name}`}
      min={0}
      allowDecimal={false}
      size="xs"
      w={85}
      value={order}
      onChange={setOrder}
      disabled={disabled}
      error={!valid}
      onBlur={() => {
        if (valid && order !== value) onSave(order);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}
