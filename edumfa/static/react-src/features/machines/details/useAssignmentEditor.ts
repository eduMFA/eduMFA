import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";

import type { OptionValues } from "./types";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  detachTokenFromMachine,
  saveMachineTokenOptions,
  type MachineTokenAssignment
} from "@/api/machines";

export interface AssignmentEditor {
  cancelEditing: () => void;
  detachMutation: UseMutationResult<number, Error, MachineTokenAssignment>;
  draftOptions: OptionValues;
  /** The assignment whose options are being edited, if any. */
  editingAssignmentId: number | null;
  saveOptionsMutation: UseMutationResult<number, Error, MachineTokenAssignment>;
  setDraftOption: (name: string, value: boolean | string) => void;
  startEditing: (assignment: MachineTokenAssignment) => void;
}

/** Inline editing of one assignment's options, plus detaching assignments. */
export function useAssignmentEditor(
  invalidateTokens: () => Promise<void>
): AssignmentEditor {
  const apiClient = useApiClient();
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [draftOptions, setDraftOptions] = useState<OptionValues>({});

  const detachMutation = useMutation({
    mutationFn: (assignment: MachineTokenAssignment) =>
      detachTokenFromMachine(apiClient, {
        application: assignment.application,
        mtid: assignment.id,
        serial: assignment.serial
      }),
    onSuccess: invalidateTokens
  });

  const saveOptionsMutation = useMutation({
    mutationFn: (assignment: MachineTokenAssignment) =>
      saveMachineTokenOptions(apiClient, { ...draftOptions, mtid: assignment.id }),
    onSuccess: async () => {
      setEditingAssignmentId(null);
      await invalidateTokens();
    }
  });

  return {
    cancelEditing: () => {
      setEditingAssignmentId(null);
    },
    detachMutation,
    draftOptions,
    editingAssignmentId,
    saveOptionsMutation,
    setDraftOption: (name, value) => {
      setDraftOptions((previous) => ({ ...previous, [name]: value }));
    },
    startEditing: (assignment) => {
      setDraftOptions({ ...assignment.options });
      setEditingAssignmentId(assignment.id);
    }
  };
}
