import type { ReactNode } from "react";

import { toText } from "./resolverTypes";
import type {
  ResolverTestRequest,
  ResolverType,
  ResolverWriteRequest
} from "@/api/resolvers";

export type ResolverValues = Record<string, boolean | string>;

export interface ResolverField {
  key: string;
  label: ReactNode;
  kind?: "checkbox" | "password" | "textarea" | "json" | "url";
  options?: (string | { label: string; value: string })[];
  placeholder?: string;
  required?: boolean;
  showWhen?: (values: ResolverValues) => boolean;
}

export interface ResolverPreset {
  label: ReactNode;
  values: ResolverValues;
}

/** What a connection-based resolver page hands to the shared editor. */
export interface ResolverConnectionConfig {
  defaults?: ResolverValues;
  fields: ResolverField[];
  label: string;
  presets?: ResolverPreset[];
  type: ResolverType;
}

/**
 * The `POST /resolver/test` body: the save payload, the stored name (so
 * censored secrets resolve) and the legacy LDAP adjustments: the quick test
 * limits the result to one entry, an anonymous bind is sent as an empty
 * simple bind.
 */
export function toResolverTestRequest(
  type: ResolverType,
  request: ResolverWriteRequest,
  resolverName: string,
  quick: boolean
): ResolverTestRequest {
  const payload: ResolverTestRequest = {
    ...request,
    ...(resolverName ? { resolver: resolverName } : {})
  };
  if (type === "ldapresolver") {
    payload.SIZELIMIT = quick ? 1 : 0;
    if (payload.AUTHTYPE === "Anonymous") {
      payload.AUTHTYPE = "Simple";
      payload.BINDDN = "";
      payload.BINDPW = "";
    }
  }
  return payload;
}

export type ResolverFieldError = "required" | "json" | "url";

/** The inline validation of one field; `null` when the value passes. */
export function getResolverFieldError(
  field: ResolverField,
  value: boolean | string | undefined
): ResolverFieldError | null {
  const text = toText(value).trim();
  if (!text) return field.required ? "required" : null;
  if (field.kind === "json") {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "json";
    } catch {
      return "json";
    }
  }
  if (field.kind === "url") {
    try {
      if (!["http:", "https:"].includes(new URL(text).protocol)) return "url";
    } catch {
      return "url";
    }
  }
  return null;
}
