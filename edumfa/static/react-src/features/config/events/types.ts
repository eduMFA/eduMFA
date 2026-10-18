import type { EventForm as EventFormValues } from "@/features/config/automation/definitionForm";

/** Merges a partial update into the event form state. */
export type EventFormChange = (patch: Partial<EventFormValues>) => void;
