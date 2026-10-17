import { Trans, useLingui } from "@lingui/react/macro";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button, Checkbox, NativeSelect, Stack, Table, TextInput } from "@mantine/core";

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
  const options = (
    values: Record<string, { description: string }>,
    current: string
  ) => [...new Set([current, ...Object.keys(values)])];
  return (
    <Stack>
      {conditions.length ? (
        <Table.ScrollContainer minWidth={700}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Trans>Active</Trans>
                </Table.Th>
                <Table.Th>
                  <Trans>Section</Trans>
                </Table.Th>
                <Table.Th>
                  <Trans>Key</Trans>
                </Table.Th>
                <Table.Th>
                  <Trans>Comparator</Trans>
                </Table.Th>
                <Table.Th>
                  <Trans>Value</Trans>
                </Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {conditions.map(([section, key, comparator, value, active], index) => {
                const number = index + 1;
                return (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Checkbox
                        aria-label={t`Active condition ${number}`}
                        checked={active}
                        onChange={(event) => {
                          update(index, [
                            section,
                            key,
                            comparator,
                            value,
                            event.currentTarget.checked
                          ]);
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
                          update(index, [
                            event.currentTarget.value,
                            key,
                            comparator,
                            value,
                            active
                          ]);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        aria-label={t`Key ${number}`}
                        value={key}
                        required={active}
                        onChange={(event) => {
                          update(index, [
                            section,
                            event.currentTarget.value,
                            comparator,
                            value,
                            active
                          ]);
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
                          update(index, [
                            section,
                            key,
                            event.currentTarget.value,
                            value,
                            active
                          ]);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        aria-label={t`Value ${number}`}
                        value={value}
                        onChange={(event) => {
                          update(index, [
                            section,
                            key,
                            comparator,
                            event.currentTarget.value,
                            active
                          ]);
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
                        onClick={() => {
                          onChange(conditions.filter((_, i) => i !== index));
                        }}
                      >
                        <Trans>Remove</Trans>
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
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
        <Trans>Add a condition</Trans>
      </Button>
    </Stack>
  );
}
