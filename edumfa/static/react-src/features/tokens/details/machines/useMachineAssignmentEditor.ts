import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  detachTokenFromMachine,
  saveMachineTokenOptions,
  type MachineTokenAssignment
} from "@/api/machines";

export interface MachineAssignmentEditorParams {
  /** Re-reads the assignments after a change. */
  onChanged: () => Promise<void>;
  serial: string;
}

/**
 * Option editing and detaching of the token's machine assignments. One
 * assignment at a time is in edit mode; its options are drafted here until
 * they are saved.
 */
export function useMachineAssignmentEditor({
  onChanged,
  serial
}: MachineAssignmentEditorParams) {
  const apiClient = useApiClient();
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [draftOptions, setDraftOptions] = useState<Record<string, boolean | string>>(
    {}
  );

  const detach = useMutation({
    mutationFn: (assignment: MachineTokenAssignment) =>
      detachTokenFromMachine(apiClient, {
        application: assignment.application,
        mtid: assignment.id,
        serial
      }),
    onSuccess: onChanged
  });
  const saveOptions = useMutation({
    mutationFn: (assignment: MachineTokenAssignment) =>
      saveMachineTokenOptions(apiClient, { ...draftOptions, mtid: assignment.id }),
    onSuccess: async () => {
      setEditingAssignmentId(null);
      await onChanged();
    }
  });

  const startEditing = (assignment: MachineTokenAssignment) => {
    setDraftOptions({ ...assignment.options });
    setEditingAssignmentId(assignment.id);
  };
  const stopEditing = () => {
    setEditingAssignmentId(null);
  };
  const setDraftOption = (name: string, value: boolean | string) => {
    setDraftOptions((previous) => ({ ...previous, [name]: value }));
  };

  return {
    detach,
    draftOptions,
    editingAssignmentId,
    saveOptions,
    setDraftOption,
    startEditing,
    stopEditing
  };
}

export type MachineAssignmentEditor = ReturnType<typeof useMachineAssignmentEditor>;
