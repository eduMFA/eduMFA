import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Box, Checkbox, Stack, Text } from "@mantine/core";

import { policyActionChoices, policyActionValue } from "./policyActionEntries";
import type { PolicyActionDefinition } from "@/api/policies";
import {
  TypedOptionInput,
  type TypedOptionValue
} from "@/components/forms/TypedOptionInput";

/** One action: its checkbox with description, help link and, unless boolean, its value input. */
export function PolicyActionItem({
  actions,
  docsUrl,
  known,
  name,
  onChange,
  spec
}: {
  actions: Record<string, TypedOptionValue>;
  docsUrl: string;
  /** False for a stored action the current definitions do not list. */
  known: boolean;
  name: string;
  onChange: (actions: Record<string, TypedOptionValue>) => void;
  spec: PolicyActionDefinition;
}) {
  const { t } = useLingui();
  const selected = name in actions;
  const value = policyActionValue(spec, actions[name]);
  const choices = policyActionChoices(spec, value);

  return (
    <Stack className="policy-action-item" gap="xs">
      <Box className="policy-action-row">
        <Checkbox
          className="policy-action-description"
          checked={selected}
          label={name}
          description={spec.desc}
          onChange={(event) => {
            onChange(
              event.currentTarget.checked
                ? {
                    ...actions,
                    [name]: spec.type === "bool" ? true : spec.multiple ? [] : ""
                  }
                : Object.fromEntries(
                    Object.entries(actions).filter(([key]) => key !== name)
                  )
            );
          }}
        />
        <Anchor
          className="policy-action-help"
          href={`${docsUrl}#${name.replaceAll("_", "-").toLowerCase()}`}
          target="_blank"
          rel="noopener"
          size="xs"
        >
          <Trans>Help</Trans>
        </Anchor>
      </Box>
      {spec.type !== "bool" ? (
        <TypedOptionInput
          id={`policy-action-${name}`}
          label={t`Value for ${name}`}
          disabled={!selected}
          spec={{
            type: spec.multiple ? "multi" : spec.type,
            value: choices,
            required: selected
          }}
          value={value}
          onChange={(next) => {
            onChange({ ...actions, [name]: next });
          }}
        />
      ) : null}
      {!known ? (
        <Text c="dimmed" size="xs">
          <Trans>
            This action is not in the current definitions. Its value will be preserved.
          </Trans>
        </Text>
      ) : null}
    </Stack>
  );
}
