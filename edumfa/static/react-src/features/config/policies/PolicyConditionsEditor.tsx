import { useLingui } from "@lingui/react/macro";
import { IconPlus } from "@tabler/icons-react";
import { Button, Stack, Table } from "@mantine/core";

import { PolicyConditionRow } from "./PolicyConditionRow";
import type { PolicyCondition, PolicyConditionDefinitions } from "@/api/policies";

export function PolicyConditionsEditor({
  conditions,
  definitions,
  onChange
}: {
  conditions: PolicyCondition[];
  definitions: PolicyConditionDefinitions;
  onChange: (conditions: PolicyCondition[]) => void;
}) {
  const { t } = useLingui();

  const update = (index: number, condition: PolicyCondition) => {
    onChange(conditions.map((existing, i) => (i === index ? condition : existing)));
  };
  return (
    <Stack>
      {conditions.length ? (
        <Table.ScrollContainer minWidth={700}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t`Active`}</Table.Th>
                <Table.Th>{t`Section`}</Table.Th>
                <Table.Th>{t`Key`}</Table.Th>
                <Table.Th>{t`Comparator`}</Table.Th>
                <Table.Th>{t`Value`}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {conditions.map((condition, index) => (
                <PolicyConditionRow
                  key={index}
                  condition={condition}
                  definitions={definitions}
                  number={index + 1}
                  onChange={(next) => {
                    update(index, next);
                  }}
                  onRemove={() => {
                    onChange(conditions.filter((_, i) => i !== index));
                  }}
                />
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : null}
      <Button
        leftSection={<IconPlus aria-hidden size={16} />}
        type="button"
        variant="light"
        onClick={() => {
          onChange([...conditions, ["userinfo", "", "equals", "", false]]);
        }}
      >
        {t`Add a condition`}
      </Button>
    </Stack>
  );
}
