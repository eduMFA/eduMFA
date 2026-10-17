import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Group, NativeSelect, Text, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { KeyValueTable } from "./KeyValueTable";
import { SmsProviderParameterField } from "./SmsProviderParameterField";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  saveSmsGateway,
  serverQueryKeys,
  type SmsGateway,
  type SmsGatewayRequest,
  type SmsProvider,
  type SmsProviders
} from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { toText } from "@/features/config/servers/serverForm";

export interface SmsGatewayFormProps {
  /** The definition being edited; absent for a new gateway. */
  existing?: SmsGateway;
  providers: SmsProviders;
}

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

/**
 * Splits the stored options like the legacy controller: declared
 * parameters of the provider module become form fields, the rest are the
 * free-form options table.
 */
function createInitialValues(
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

/**
 * Port of `config.smsgateway.edit.html`: name, provider module and
 * description, the module's parameters, and the options and headers
 * tables the module allows. Saving navigates back to the list.
 */
export function SmsGatewayForm({ existing, providers }: SmsGatewayFormProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "smsgateway_write");
  const [values, setValues] = useState(() => createInitialValues(existing, providers));

  const setValue = <TKey extends keyof SmsGatewayFormValues>(
    key: TKey,
    value: SmsGatewayFormValues[TKey]
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const setEntry = (
    key: "headers" | "options" | "parameters",
    name: string,
    value: string
  ) => {
    setValues((previous) => ({
      ...previous,
      [key]: { ...previous[key], [name]: value }
    }));
  };

  const deleteEntry = (key: "headers" | "options", name: string) => {
    setValues((previous) => ({
      ...previous,
      [key]: Object.fromEntries(
        Object.entries(previous[key]).filter(([entryName]) => entryName !== name)
      )
    }));
  };

  const moduleNames = Object.keys(providers);
  const provider = providers[values.module];
  const declaredParameters = provider?.parameters ?? {};
  const missingRequired = Object.entries(declaredParameters).some(
    ([name, parameter]) => parameter.required === true && !values.parameters[name]
  );
  const isValid = values.name !== "" && provider !== undefined && !missingRequired;

  const saveMutation = useMutation({
    mutationFn: (request: SmsGatewayRequest) => saveSmsGateway(apiClient, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.smsGateways });
      void navigate("/config/smsgateway/list");
    }
  });

  const saveButton = canWrite ? (
    <Button
      disabled={!isValid}
      leftSection={<IconDeviceFloppy size={16} />}
      loading={saveMutation.isPending}
      type="submit"
    >
      <Trans>Save SMS gateway</Trans>
    </Button>
  ) : null;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (isValid) {
          saveMutation.mutate(buildSmsGatewayRequest(values, provider, existing?.id));
        }
      }}
    >
      <PageHeader
        actions={saveButton}
        title={
          existing ? (
            <Trans>Edit SMS gateway {values.name}</Trans>
          ) : (
            <Trans>Create a new SMS gateway</Trans>
          )
        }
      />

      <ErrorAlert error={saveMutation.error} />

      <Card>
        <TextInput
          autoFocus
          id="name"
          label={<Trans>Name</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("name", event.currentTarget.value);
          }}
          required
          value={values.name}
        />
        <NativeSelect
          data={[{ label: "", value: "" }, ...moduleNames]}
          id="module"
          label={<Trans>Providermodule</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("module", event.currentTarget.value);
          }}
          required
          value={values.module}
        />
        <TextInput
          id="description"
          label={<Trans>Description</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("description", event.currentTarget.value);
          }}
          value={values.description}
        />
      </Card>

      {provider ? (
        <Card title={<Trans>Parameters</Trans>}>
          {Object.entries(declaredParameters).map(([name, parameter]) => (
            <SmsProviderParameterField
              key={name}
              name={name}
              onChange={(value) => {
                setEntry("parameters", name, value);
              }}
              parameter={parameter}
              value={values.parameters[name] ?? ""}
            />
          ))}
          {Object.keys(declaredParameters).length === 0 ? (
            <Text c="dimmed" size="sm">
              <Trans>This provider module has no parameters.</Trans>
            </Text>
          ) : null}
        </Card>
      ) : null}

      {provider?.options_allowed ? (
        <Card flush title={<Trans>Options</Trans>}>
          <KeyValueTable
            entries={values.options}
            idPrefix="option"
            nameLabel={t`Option name`}
            onAdd={(name, value) => {
              setEntry("options", name, value);
            }}
            onDelete={(name) => {
              deleteEntry("options", name);
            }}
            valueLabel={t`Option value`}
          />
        </Card>
      ) : null}

      {provider?.headers_allowed ? (
        <Card flush title={<Trans>Headers</Trans>}>
          <KeyValueTable
            entries={values.headers}
            idPrefix="header"
            nameLabel={t`Header name`}
            onAdd={(name, value) => {
              setEntry("headers", name, value);
            }}
            onDelete={(name) => {
              deleteEntry("headers", name);
            }}
            valueLabel={t`Header value`}
          />
        </Card>
      ) : null}

      {provider && saveButton ? (
        // The legacy form repeated the button below the parameter tables.
        <Group justify="center" mb="lg">
          {saveButton}
        </Group>
      ) : null}
    </form>
  );
}
