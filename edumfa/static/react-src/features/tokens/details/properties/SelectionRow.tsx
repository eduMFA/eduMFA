import { Checkbox, List, Stack, Table } from "@mantine/core";
import { useState, type ReactNode } from "react";

import { EditRowButtons } from "./EditRowButtons";

export interface SelectionOption {
  label: string;
  value: string;
}

export interface SelectionRowProps {
  /** `data-field` of the read-only list. */
  dataField: string;
  isSaving: boolean;
  label: ReactNode;
  locked: boolean;
  onSave: (selected: string[]) => void;
  /** Every known entry; each gets a checkbox while editing. */
  options: SelectionOption[];
  /** The right that allows editing the row. */
  right: string;
  saveLabel: ReactNode;
  /** The entries the token currently has. */
  selected: string[];
}

/**
 * A row listing the token's entries (realms, token groups) that turns into
 * a checkbox per known entry while editing.
 */
export function SelectionRow({
  dataField,
  isSaving,
  label,
  locked,
  onSave,
  options,
  right,
  saveLabel,
  selected
}: SelectionRowProps) {
  const [draft, setDraft] = useState<string[] | null>(null);

  const toggle = (value: string, checked: boolean) => {
    setDraft((previous) => {
      const current = previous ?? [];

      return checked ? [...current, value] : current.filter((entry) => entry !== value);
    });
  };

  return (
    <Table.Tr>
      <Table.Td fw={600}>{label}</Table.Td>
      <Table.Td>
        {draft ? (
          <Stack gap={4}>
            {options.map((option) => (
              <Checkbox
                checked={draft.includes(option.value)}
                key={option.value}
                label={option.label}
                onChange={(event) => {
                  toggle(option.value, event.currentTarget.checked);
                }}
                size="sm"
              />
            ))}
          </Stack>
        ) : (
          <List data-field={dataField} size="sm" spacing={2}>
            {selected.map((value) => (
              <List.Item key={value}>{value}</List.Item>
            ))}
          </List>
        )}
      </Table.Td>
      <Table.Td ta="right">
        <EditRowButtons
          isEditing={draft !== null}
          isSaving={isSaving}
          locked={locked}
          onCancel={() => {
            setDraft(null);
          }}
          onEdit={() => {
            setDraft([...selected]);
          }}
          onSave={() => {
            onSave(draft ?? []);
            setDraft(null);
          }}
          right={right}
          saveLabel={saveLabel}
        />
      </Table.Td>
    </Table.Tr>
  );
}
