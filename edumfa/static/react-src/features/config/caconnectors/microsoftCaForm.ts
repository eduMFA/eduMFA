import { buildCaConnectorRequest, readFlag, readText } from "./caConnectorForm";
import type { CaConnector, CaConnectorWriteRequest } from "@/api/caConnectors";

export interface MicrosoftCaFormValues {
  ca: string;
  connectorname: string;
  hostname: string;
  http_proxy: boolean;
  port: string;
  ssl_ca_cert: string;
  ssl_client_cert: string;
  ssl_client_key: string;
  ssl_client_key_password: string;
  use_ssl: boolean;
}

/**
 * The legacy controller added this marker when editing so the key password
 * stays stored encrypted; it is sent along for an identical payload.
 */
const EDIT_REQUEST_EXTRA = { "type.ssl_client_key_password": "password" };

/** The form values of the loaded connector, or the blanks of a new one. */
export function toMicrosoftCaFormValues(
  connector: CaConnector | null
): MicrosoftCaFormValues {
  const data = connector?.data ?? {};

  return {
    ca: readText(data, "ca"),
    connectorname: connector?.connectorname ?? "",
    hostname: readText(data, "hostname"),
    http_proxy: readFlag(data, "http_proxy"),
    port: readText(data, "port"),
    ssl_ca_cert: readText(data, "ssl_ca_cert"),
    ssl_client_cert: readText(data, "ssl_client_cert"),
    ssl_client_key: readText(data, "ssl_client_key"),
    ssl_client_key_password: readText(data, "ssl_client_key_password"),
    use_ssl: readFlag(data, "use_ssl")
  };
}

/** The `POST /caconnector/<name>` body, also sent to ask the worker for its CAs. */
export function toMicrosoftCaRequest(
  form: MicrosoftCaFormValues,
  isEditing: boolean
): CaConnectorWriteRequest {
  const values = Object.fromEntries(
    Object.entries(form).filter(([key]) => key !== "connectorname")
  );
  return buildCaConnectorRequest(
    "microsoft",
    values,
    isEditing ? EDIT_REQUEST_EXTRA : {}
  );
}
