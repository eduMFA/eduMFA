import { useLingui } from "@lingui/react/macro";
import { IconTrash } from "@tabler/icons-react";
import { Button, Checkbox, NativeSelect, Table, TextInput } from "@mantine/core";

import type { PolicyCondition, PolicyConditionDefinitions } from "@/api/policies";

/** One additional condition: active flag, section, key, comparator, value and remove. */
export function PolicyConditionRow({
  condition,
  definitions,
  number,
  onChange,
  onRemove
}: {
  condition: PolicyCondition;
  definitions: PolicyConditionDefinitions;
  /** One-based position, used in the accessible labels. */
  number: number;
  onChange: (condition: PolicyCondition) => void;
  onRemove: () => void;
}) {
  const { t } = useLingui();
  const [section, key, comparator, value, active] = condition;

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          aria-label={t`Active condition ${number}`}
          checked={active}
          onChange={(event) => {
            onChange([section, key, comparator, value, event.currentTarget.checked]);
          }}
        />
      </Table.Td>
      <Table.Td>
        <NativeSelect
          aria-label={t`Section ${number}`}
          data={options(definitions.sections, section)}
          value={section}
          description={definitions.sections[section]?.description}
          onChange={(event) => {
            onChange([event.currentTarget.value, key, comparator, value, active]);
          }}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          aria-label={t`Key ${number}`}
          value={key}
          required={active}
          onChange={(event) => {
            onChange([section, event.currentTarget.value, comparator, value, active]);
          }}
        />
      </Table.Td>
      <Table.Td>
        <NativeSelect
          aria-label={t`Comparator ${number}`}
          data={options(definitions.comparators, comparator)}
          value={comparator}
          description={definitions.comparators[comparator]?.description}
          onChange={(event) => {
            onChange([section, key, event.currentTarget.value, value, active]);
          }}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          aria-label={t`Value ${number}`}
          value={value}
          onChange={(event) => {
            onChange([section, key, comparator, event.currentTarget.value, active]);
          }}
        />
      </Table.Td>
      <Table.Td>
        <Button
          type="button"
          color="red"
          leftSection={<IconTrash aria-hidden size={16} />}
          variant="light"
          aria-label={t`Remove condition ${number}`}
          onClick={onRemove}
        >
          {t`Remove`}
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}

/** The stored choice stays selectable even when the definitions no longer list it. */
function options(values: Record<string, { description: string }>, current: string) {
  return [...new Set([current, ...Object.keys(values)])];
}
