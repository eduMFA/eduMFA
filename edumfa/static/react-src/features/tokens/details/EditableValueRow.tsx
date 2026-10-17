import { Trans } from "@lingui/react/macro";
import { Button, Group, Table, TextInput } from "@mantine/core";
import { useState, type ReactNode } from "react";

export interface EditableValueRowProps {
  /** Label of the save button, e.g. "Set max fail". */
  buttonLabel: ReactNode;
  /** The session holds the right to change the value. */
  canEdit: boolean;
  /** `hide_buttons` policy: hide the edit button instead of disabling it. */
  hideButtons: boolean;
  id: string;
  inputType?: "number" | "text";
  isSaving?: boolean;
  label: ReactNode;
  /** Locked tokens cannot be changed at all; no buttons are shown. */
  locked: boolean;
  maxLength?: number | undefined;
  onSave: (value: string) => void;
  value: string;
}

/**
 * Port of the legacy `token-data-edit` directive: a label/value row whose
 * value turns into an input with save and cancel buttons.
 */
export function EditableValueRow({
  buttonLabel,
  canEdit,
  hideButtons,
  id,
  inputType = "text",
  isSaving = false,
  label,
  locked,
  maxLength,
  onSave,
  value
}: EditableValueRowProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const isEditing = draft !== null;
  const isValid =
    draft !== null &&
    (inputType === "number" ? /^[0-9]*$/.test(draft) : true) &&
    (maxLength === undefined || draft.length <= maxLength);

  return (
    <Table.Tr>
      <Table.Td fw={600} w="25%">
        {label}
      </Table.Td>
      <Table.Td>
        {isEditing ? (
          <TextInput
            aria-label={typeof label === "string" ? label : undefined}
            autoFocus
            error={isValid ? undefined : true}
            id={id}
            inputMode={inputType === "number" ? "numeric" : undefined}
            maxLength={maxLength}
            onChange={(event) => {
              setDraft(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && isValid) {
                event.preventDefault();
                onSave(draft);
                setDraft(null);
              }
            }}
            size="sm"
            value={draft}
          />
        ) : (
          <span data-field={id}>{value}</span>
        )}
      </Table.Td>
      <Table.Td ta="right" w="30%">
        {locked ? null : isEditing ? (
          <Group gap="xs" justify="flex-end">
            <Button
              disabled={!isValid}
              loading={isSaving}
              onClick={() => {
                onSave(draft);
                setDraft(null);
              }}
              size="xs"
            >
              {buttonLabel}
            </Button>
            <Button
              onClick={() => {
                setDraft(null);
              }}
              size="xs"
              variant="default"
            >
              <Trans>Cancel</Trans>
            </Button>
          </Group>
        ) : !canEdit && hideButtons ? null : (
          <Button
            disabled={!canEdit}
            onClick={() => {
              setDraft(value);
            }}
            size="xs"
            variant="default"
          >
            <Trans>Edit</Trans>
          </Button>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
