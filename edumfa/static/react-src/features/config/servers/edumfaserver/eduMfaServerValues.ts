import { isConfigEnabled } from "@/api/config";
import type { EduMfaServer, EduMfaServerRequest } from "@/api/servers";
import { toText } from "@/features/config/servers/serverForm";

export interface ExistingEduMfaServer {
  identifier: string;
  server: EduMfaServer;
}

export interface EduMfaServerFormValues {
  description: string;
  identifier: string;
  /** Test request only; never stored. */
  password: string;
  tls: boolean;
  url: string;
  /** Test request only; never stored. */
  username: string;
}

/** Sets one field of the form. */
export type EduMfaServerFieldSetter = <TKey extends keyof EduMfaServerFormValues>(
  key: TKey,
  value: EduMfaServerFormValues[TKey]
) => void;

export function createEduMfaServerValues(
  existing: ExistingEduMfaServer | undefined
): EduMfaServerFormValues {
  if (!existing) {
    // The legacy controller verified the certificate by default.
    return {
      description: "",
      identifier: "",
      password: "",
      tls: true,
      url: "",
      username: ""
    };
  }

  const { identifier, server } = existing;

  return {
    description: toText(server.description),
    identifier,
    password: "",
    tls: isConfigEnabled(server.tls),
    url: toText(server.url),
    username: ""
  };
}

/** The `POST /edumfaserver/<identifier>` body. */
export function buildEduMfaServerRequest(
  values: EduMfaServerFormValues
): EduMfaServerRequest {
  return {
    description: values.description,
    identifier: values.identifier,
    tls: values.tls,
    url: values.url
  };
}
