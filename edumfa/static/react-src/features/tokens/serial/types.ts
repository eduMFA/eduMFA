/**
 * "init" shows the form, "count" asks whether to run the (possibly slow)
 * search over the counted tokens, "found" shows the result.
 */
export type LookupStep = "count" | "found" | "init";

export type AssignmentFilter = "" | "assigned" | "unassigned";

/** The search parameters as edited in the form. */
export interface SerialLookupFields {
  assignment: AssignmentFilter;
  countWindow: string;
  otp: string;
  serialSubstring: string;
  tokenType: string;
}

export type SerialLookupFieldName = keyof SerialLookupFields;
