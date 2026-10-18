import type { ServiceId } from "@/api/serviceIds";

/** `resourceNamePatterns.simple` of the legacy app. */
export const RESOURCE_NAME_PATTERN = /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/;

export interface ServiceIdFormValues {
  description: string;
  servicename: string;
}

/** The loaded service ID when editing. */
export interface ExistingServiceId {
  service: ServiceId;
  servicename: string;
}
