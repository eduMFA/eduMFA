import { useLingui } from "@lingui/react/macro";
import { Checkbox, Stack } from "@mantine/core";
import {
  TypedOptionInput,
  type TypedOptionSpec
} from "@/components/forms/TypedOptionInput";
import type { DefinitionValues } from "@/features/config/automation/definitionForm";

/** One condition: its checkbox and the value input, enabled once the condition is active. */
export function EventConditionItem({
  name,
  onChange,
  spec,
  values
}: {
  name: string;
  onChange: (values: DefinitionValues) => void;
  spec: TypedOptionSpec;
  values: DefinitionValues;
}) {
  const { t } = useLingui();
  return (
    <Stack gap="xs">
      <Checkbox
        label={name}
        checked={name in values}
        onChange={(event) => {
          onChange(
            event.currentTarget.checked
              ? { ...values, [name]: spec.type === "multi" ? [] : "" }
              : Object.fromEntries(
                  Object.entries(values).filter(([key]) => key !== name)
                )
          );
        }}
      />
      <TypedOptionInput
        id={`condition-${name}`}
        label={t`Value for ${name}`}
        spec={{
          ...spec,
          required: Boolean(spec.required && name in values)
        }}
        disabled={!(name in values)}
        value={values[name]}
        onChange={(value) => {
          onChange({ ...values, [name]: value });
        }}
      />
    </Stack>
  );
}
