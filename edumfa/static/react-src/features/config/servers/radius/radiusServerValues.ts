import type { RadiusServer, RadiusServerRequest } from "@/api/servers";
import {
  toNumberField,
  toOptionalInteger,
  toText,
  type NumberFieldValue
} from "@/features/config/servers/serverForm";

export interface ExistingRadiusServer {
  identifier: string;
  server: RadiusServer;
}

export interface RadiusServerFormValues {
  description: string;
  dictionary: string;
  enforce_ma: boolean;
  identifier: string;
  /** Test request only; never stored. */
  password: string;
  port: NumberFieldValue;
  retries: NumberFieldValue;
  secret: string;
  server: string;
  timeout: NumberFieldValue;
  /** Test request only; never stored. */
  username: string;
}

/** Sets one field of the form. */
export type RadiusServerFieldSetter = <TKey extends keyof RadiusServerFormValues>(
  key: TKey,
  value: RadiusServerFormValues[TKey]
) => void;

export function createRadiusServerValues(
  existing: ExistingRadiusServer | undefined
): RadiusServerFormValues {
  // The list call never delivers the secret, so it has to be typed again.
  const secret = "";

  if (!existing) {
    return {
      description: "",
      dictionary: "",
      enforce_ma: false,
      identifier: "",
      password: "",
      port: "",
      retries: "",
      secret,
      server: "",
      timeout: "",
      username: ""
    };
  }

  const { identifier, server } = existing;

  return {
    description: toText(server.description),
    dictionary: toText(server.dictionary),
    enforce_ma: server.enforce_ma === true,
    identifier,
    password: "",
    port: toNumberField(server.port),
    retries: toNumberField(server.retries),
    secret,
    server: server.server,
    timeout: toNumberField(server.timeout),
    username: ""
  };
}

/**
 * The `POST /radiusserver/<identifier>` body. Empty numbers and an empty
 * dictionary are left out so the backend applies its defaults, like the
 * untouched legacy inputs that never made it into `params`.
 */
export function buildRadiusServerRequest(
  values: RadiusServerFormValues
): RadiusServerRequest {
  const request: RadiusServerRequest = {
    description: values.description,
    enforce_ma: values.enforce_ma,
    identifier: values.identifier,
    secret: values.secret,
    server: values.server
  };
  const port = toOptionalInteger(values.port);
  const retries = toOptionalInteger(values.retries);
  const timeout = toOptionalInteger(values.timeout);

  if (values.dictionary !== "") {
    request.dictionary = values.dictionary;
  }

  if (port !== undefined) {
    request.port = port;
  }

  if (retries !== undefined) {
    request.retries = retries;
  }

  if (timeout !== undefined) {
    request.timeout = timeout;
  }

  return request;
}
