import { Table, TextInput } from "@mantine/core";
import { useState, type ReactNode } from "react";

import { EditableValueActions } from "./EditableValueActions";

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
  const saveDraft = () => {
    if (draft !== null) {
      onSave(draft);
      setDraft(null);
    }
  };

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
                saveDraft();
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
        <EditableValueActions
          buttonLabel={buttonLabel}
          canEdit={canEdit}
          hideButtons={hideButtons}
          isEditing={isEditing}
          isSaving={isSaving}
          isValid={isValid}
          locked={locked}
          onCancel={() => {
            setDraft(null);
          }}
          onEdit={() => {
            setDraft(value);
          }}
          onSave={saveDraft}
        />
      </Table.Td>
    </Table.Tr>
  );
}
