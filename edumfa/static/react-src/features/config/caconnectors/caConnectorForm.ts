import {
  type CaConnectorParams,
  type CaConnectorType,
  type CaConnectorWriteRequest
} from "@/api/caConnectors";
import { isConfigEnabled } from "@/api/config";

/** `resourceNamePatterns.simple` of the legacy app. */
export const RESOURCE_NAME_PATTERN = /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/;

/** A stored connector value as the text its input shows. */
export function readText(data: Record<string, unknown>, key: string): string {
  const value = data[key];

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

/** A stored connector flag; the backend delivers booleans, older rows strings. */
export function readFlag(data: Record<string, unknown>, key: string): boolean {
  return isConfigEnabled(data[key]);
}

/**
 * The body of `POST /caconnector/<name>`: the type, the form values and the
 * extra legacy keys. Blank inputs are left out because the backend stores
 * values verbatim and the local CA converts the CRL periods with `int()`.
 */
export function buildCaConnectorRequest(
  connectorType: CaConnectorType,
  values: Record<string, boolean | string>,
  extra: CaConnectorParams = {}
): CaConnectorWriteRequest {
  const request: CaConnectorWriteRequest = { type: connectorType };

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "boolean" || value.trim() !== "") {
      request[key] = value;
    }
  }

  return { ...request, ...extra };
}
