import type { TaskForm as TaskFormValues } from "@/features/config/automation/definitionForm";

/** Merges a partial update into the task form state. */
export type TaskFormChange = (patch: Partial<TaskFormValues>) => void;
