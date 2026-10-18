import type {
  SmsGateway,
  SmsGatewayRequest,
  SmsProvider,
  SmsProviders
} from "@/api/servers";
import { toText } from "@/features/config/servers/serverForm";

export interface SmsGatewayFormValues {
  description: string;
  headers: Record<string, string>;
  module: string;
  name: string;
  /** Additional options outside the provider's declared parameters. */
  options: Record<string, string>;
  /** Values of the provider's declared parameters, by parameter name. */
  parameters: Record<string, string>;
}

/** Sets one field of the form. */
export type SmsGatewayFieldSetter = <TKey extends keyof SmsGatewayFormValues>(
  key: TKey,
  value: SmsGatewayFormValues[TKey]
) => void;

/** The name/value groups of the form. */
export type SmsGatewayEntryGroup = "headers" | "options" | "parameters";

/**
 * Splits the stored options like the legacy controller: declared
 * parameters of the provider module become form fields, the rest are the
 * free-form options table.
 */
export function createSmsGatewayValues(
  existing: SmsGateway | undefined,
  providers: SmsProviders
): SmsGatewayFormValues {
  if (!existing) {
    return {
      description: "",
      headers: {},
      module: "",
      name: "",
      options: {},
      parameters: {}
    };
  }

  const declared = providers[existing.providermodule]?.parameters ?? {};
  const parameters: Record<string, string> = {};
  const options: Record<string, string> = {};

  for (const [key, value] of Object.entries(existing.options)) {
    if (Object.hasOwn(declared, key)) {
      parameters[key] = value;
    } else {
      options[key] = value;
    }
  }

  return {
    description: toText(existing.description),
    headers: { ...existing.headers },
    module: existing.providermodule,
    name: existing.name,
    options,
    parameters
  };
}

/** The legacy `ng-disabled`: a name, a known module and every required parameter. */
export function isSmsGatewayValid(
  values: SmsGatewayFormValues,
  provider: SmsProvider | undefined
): boolean {
  const declaredParameters = provider?.parameters ?? {};
  const missingRequired = Object.entries(declaredParameters).some(
    ([name, parameter]) => parameter.required === true && !values.parameters[name]
  );

  return values.name !== "" && provider !== undefined && !missingRequired;
}

/**
 * The `POST /smsgateway` body: parameters and options go as
 * `option.<name>`, headers as `header.<name>`. Parameter values of a
 * previously selected module are dropped.
 */
export function buildSmsGatewayRequest(
  values: SmsGatewayFormValues,
  provider: SmsProvider | undefined,
  existingId?: number
): SmsGatewayRequest {
  const request: SmsGatewayRequest = {
    description: values.description,
    module: values.module,
    name: values.name
  };
  const declared = provider?.parameters ?? {};

  if (existingId !== undefined) {
    request.id = existingId;
  }

  for (const [key, value] of Object.entries(values.parameters)) {
    if (Object.hasOwn(declared, key)) {
      request[`option.${key}`] = value;
    }
  }

  for (const [key, value] of Object.entries(values.options)) {
    request[`option.${key}`] = value;
  }

  for (const [key, value] of Object.entries(values.headers)) {
    request[`header.${key}`] = value;
  }

  return request;
}
