import type { Tokengroup } from "@/api/config";

/** `resourceNamePatterns.simple` of the legacy app. */
export const RESOURCE_NAME_PATTERN = /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/;

export interface TokengroupFormValues {
  description: string;
  groupname: string;
}

/** The loaded group when editing. */
export interface ExistingTokengroup {
  group: Tokengroup;
  groupname: string;
}
