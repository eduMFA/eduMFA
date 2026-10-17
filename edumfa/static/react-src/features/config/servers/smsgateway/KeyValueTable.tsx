import { Trans } from "@lingui/react/macro";
import { Button, Table, Text, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

export interface KeyValueTableProps {
  entries: Record<string, string>;
  /** Prefix of the input ids, e.g. "option" or "header". */
  idPrefix: string;
  nameLabel: string;
  onAdd: (name: string, value: string) => void;
  onDelete: (name: string) => void;
  valueLabel: string;
}

/**
 * The additional options and headers of an SMS gateway: the legacy
 * name/value table with a delete button per row and an input row to add
 * one. Adding an existing name overwrites its value, like the legacy
 * `opts[name] = value`.
 */
export function KeyValueTable({
  entries,
  idPrefix,
  nameLabel,
  onAdd,
  onDelete,
  valueLabel
}: KeyValueTableProps) {
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");

  const add = () => {
    if (newName === "") {
      return;
    }

    onAdd(newName, newValue);
    setNewName("");
    setNewValue("");
  };

  return (
    <Table.ScrollContainer minWidth={480}>
      <Table verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{nameLabel}</Table.Th>
            <Table.Th>{valueLabel}</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Object.entries(entries).map(([name, value]) => (
            <Table.Tr data-entry={name} key={name}>
              <Table.Td>
                <Text fw={600} size="sm">
                  {name}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" style={{ wordBreak: "break-all" }}>
                  {value}
                </Text>
              </Table.Td>
              <Table.Td style={{ textAlign: "right" }}>
                <Button
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => {
                    onDelete(name);
                  }}
                  size="xs"
                  type="button"
                  variant="light"
                >
                  <Trans>Delete</Trans>
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td>
              <TextInput
                aria-label={nameLabel}
                id={`${idPrefix}_new_name`}
                onChange={(event) => {
                  setNewName(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    add();
                  }
                }}
                value={newName}
              />
            </Table.Td>
            <Table.Td>
              <TextInput
                aria-label={valueLabel}
                id={`${idPrefix}_new_value`}
                onChange={(event) => {
                  setNewValue(event.currentTarget.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    add();
                  }
                }}
                value={newValue}
              />
            </Table.Td>
            <Table.Td style={{ textAlign: "right" }}>
              <Button
                color="green"
                disabled={newName === ""}
                leftSection={<IconPlus size={14} />}
                onClick={add}
                size="xs"
                type="button"
                variant="light"
              >
                <Trans>Add</Trans>
              </Button>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
