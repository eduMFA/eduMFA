import { isConfigEnabled } from "@/api/config";
import type { SmtpServer, SmtpServerRequest } from "@/api/servers";
import {
  toNumberField,
  toOptionalInteger,
  toText,
  type NumberFieldValue
} from "@/features/config/servers/serverForm";

export interface ExistingSmtpServer {
  identifier: string;
  server: SmtpServer;
}

export interface SmtpServerFormValues {
  description: string;
  enqueue_job: boolean;
  identifier: string;
  password: string;
  port: NumberFieldValue;
  recipient: string;
  sender: string;
  server: string;
  timeout: NumberFieldValue;
  tls: boolean;
  username: string;
}

/** Sets one field of the form. */
export type SmtpServerFieldSetter = <TKey extends keyof SmtpServerFormValues>(
  key: TKey,
  value: SmtpServerFormValues[TKey]
) => void;

export function createSmtpServerValues(
  existing: ExistingSmtpServer | undefined
): SmtpServerFormValues {
  if (!existing) {
    // The legacy controller's defaults for a new definition.
    return {
      description: "",
      enqueue_job: false,
      identifier: "",
      password: "",
      port: 25,
      recipient: "",
      sender: "",
      server: "",
      timeout: 10,
      tls: true,
      username: ""
    };
  }

  const { identifier, server } = existing;

  return {
    description: toText(server.description),
    enqueue_job: isConfigEnabled(server.enqueue_job),
    identifier,
    password: toText(server.password),
    port: toNumberField(server.port),
    recipient: "",
    sender: toText(server.sender),
    server: server.server,
    timeout: toNumberField(server.timeout),
    tls: isConfigEnabled(server.tls),
    username: toText(server.username)
  };
}

/** The `POST /smtpserver/<identifier>` body; empty numbers are left to the backend defaults. */
export function buildSmtpServerRequest(
  values: SmtpServerFormValues
): SmtpServerRequest {
  const request: SmtpServerRequest = {
    description: values.description,
    enqueue_job: values.enqueue_job,
    identifier: values.identifier,
    password: values.password,
    sender: values.sender,
    server: values.server,
    tls: values.tls,
    username: values.username
  };
  const port = toOptionalInteger(values.port);
  const timeout = toOptionalInteger(values.timeout);

  if (port !== undefined) {
    request.port = port;
  }

  if (timeout !== undefined) {
    request.timeout = timeout;
  }

  return request;
}
