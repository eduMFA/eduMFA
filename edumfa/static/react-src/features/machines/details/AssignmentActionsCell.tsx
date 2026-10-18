import { useLingui } from "@lingui/react/macro";
import { Button, Group } from "@mantine/core";
import { IconDeviceFloppy, IconEdit, IconUnlink } from "@tabler/icons-react";

import type { AssignmentEditor } from "./useAssignmentEditor";
import type { MachineTokenAssignment } from "@/api/machines";

export interface AssignmentActionsCellProps {
  assignment: MachineTokenAssignment;
  editor: AssignmentEditor;
}

/** Save/cancel while the row is edited, otherwise edit/detach. */
export function AssignmentActionsCell({
  assignment,
  editor
}: AssignmentActionsCellProps) {
  const { t } = useLingui();

  if (editor.editingAssignmentId === assignment.id) {
    return (
      <Group gap="xs" justify="flex-end">
        <Button
          leftSection={<IconDeviceFloppy size={14} />}
          loading={editor.saveOptionsMutation.isPending}
          onClick={() => {
            editor.saveOptionsMutation.mutate(assignment);
          }}
          size="xs"
        >
          {t`Save Options`}
        </Button>
        <Button onClick={editor.cancelEditing} size="xs" variant="default">
          {t`Cancel`}
        </Button>
      </Group>
    );
  }

  return (
    <Group gap="xs" justify="flex-end">
      <Button
        leftSection={<IconEdit size={14} />}
        onClick={() => {
          editor.startEditing(assignment);
        }}
        size="xs"
        variant="default"
      >
        {t`Edit Options`}
      </Button>
      <Button
        color="red"
        leftSection={<IconUnlink size={14} />}
        loading={editor.detachMutation.isPending}
        onClick={() => {
          editor.detachMutation.mutate(assignment);
        }}
        size="xs"
        variant="light"
      >
        {t`Detach`}
      </Button>
    </Group>
  );
}
