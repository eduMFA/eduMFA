import { Trans, useLingui } from "@lingui/react/macro";
import {
  Button,
  Checkbox,
  Divider,
  NativeSelect,
  PasswordInput,
  Stack,
  TextInput
} from "@mantine/core";
import { IconDeviceFloppy, IconDownload } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useParams } from "react-router-dom";

import {
  CaConnectorEditorFrame,
  useCaConnectorEditor,
  type SaveCaConnectorVariables
} from "./caConnectorEditor";
import {
  buildCaConnectorRequest,
  RESOURCE_NAME_PATTERN,
  readFlag,
  readText
} from "./caConnectorForm";
import { useApiClient } from "@/api/ApiClientProvider";
import {
  caConnectorQueryKeys,
  getCaSpecificOptions,
  type CaConnector,
  type CaConnectorWriteRequest
} from "@/api/caConnectors";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";

interface MicrosoftCaFormValues {
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

/** Port of `config.caconnectors.microsoft.html` and `MicrosoftCAConnectorController`. */
export function MicrosoftCaConnectorPage() {
  const { connectorname } = useParams();
  const editor = useCaConnectorEditor(connectorname);

  return (
    <CaConnectorEditorFrame
      editor={editor}
      title={
        connectorname ? (
          <Trans>Edit Microsoft CA Connector {connectorname}</Trans>
        ) : (
          <Trans>Create a new Microsoft CA Connector</Trans>
        )
      }
    >
      <MicrosoftCaConnectorForm
        canWrite={editor.canWrite}
        connector={editor.connector}
        isSaving={editor.saveMutation.isPending}
        key={connectorname ?? ""}
        onSave={(variables) => {
          editor.saveMutation.mutate(variables);
        }}
      />
    </CaConnectorEditorFrame>
  );
}

interface MicrosoftCaConnectorFormProps {
  canWrite: boolean;
  /** The loaded connector when editing; `null` creates a new one. */
  connector: CaConnector | null;
  isSaving: boolean;
  onSave: (variables: SaveCaConnectorVariables) => void;
}

function toRequest(
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

function MicrosoftCaConnectorForm({
  canWrite,
  connector,
  isSaving,
  onSave
}: MicrosoftCaConnectorFormProps) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const isEditing = connector !== null;
  const data = connector?.data ?? {};
  const { formState, getValues, handleSubmit, register, control } =
    useForm<MicrosoftCaFormValues>({
      defaultValues: {
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
      },
      mode: "onChange"
    });
  const caValue = useWatch({ control, name: "ca" });
  const hostname = useWatch({ control, name: "hostname" });
  const port = useWatch({ control, name: "port" });
  const useSsl = useWatch({ control, name: "use_ssl" });

  // The legacy controller asked the worker for its CAs right after loading an
  // existing connector; "Get available CAs" asks with the current form values.
  const [optionsRequest, setOptionsRequest] = useState<CaConnectorWriteRequest | null>(
    () => (connector ? toRequest(getValues(), true) : null)
  );
  const optionsQuery = useQuery({
    enabled: optionsRequest !== null,
    queryFn: ({ signal }) =>
      getCaSpecificOptions(apiClient, "microsoft", optionsRequest ?? {}, signal),
    queryKey: caConnectorQueryKeys.specificOptions("microsoft", optionsRequest ?? {})
  });
  const availableCas = optionsQuery.data?.available_cas;

  const requestSpecificOptions = () => {
    const nextRequest = toRequest(getValues(), isEditing);

    if (JSON.stringify(nextRequest) === JSON.stringify(optionsRequest)) {
      void optionsQuery.refetch();
    } else {
      setOptionsRequest(nextRequest);
    }
  };

  // The select keeps the stored CA selectable until the worker lists it, and
  // offers the blank entry the legacy `ng-options` rendered while nothing is set.
  const caOptions = [
    ...(caValue === "" ? [""] : []),
    ...(caValue !== "" && !(availableCas ?? []).includes(caValue) ? [caValue] : []),
    ...(availableCas ?? [])
  ];
  const showCaSelect = availableCas !== undefined || caValue !== "";

  const submitForm = handleSubmit((values) => {
    onSave({ name: values.connectorname, request: toRequest(values, isEditing) });
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submitForm(event);
      }}
    >
      <Card
        footer={
          canWrite ? (
            <Button
              disabled={!formState.isValid || caValue === ""}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={isSaving}
              type="submit"
            >
              <Trans>Save CA</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <TextInput
          autoFocus
          error={formState.errors.connectorname?.message}
          id="connectorname"
          label={<Trans>Connector name</Trans>}
          mb="md"
          placeholder="MyConnector1"
          required
          {...register("connectorname", {
            pattern: {
              message: t`The resource name must consist of letters, numbers and '_', '-', '.'`,
              value: RESOURCE_NAME_PATTERN
            },
            required: true
          })}
        />

        <Divider label={<Trans>Base Config</Trans>} labelPosition="left" my="md" />

        <TextInput
          id="hostname"
          label={<Trans>Microsoft CA worker hostname</Trans>}
          mb="md"
          placeholder="example.net"
          required
          {...register("hostname", { required: true })}
        />
        <TextInput
          id="port"
          inputMode="numeric"
          label={<Trans>Microsoft CA worker port</Trans>}
          mb="md"
          placeholder="1234"
          required
          {...register("port", { required: true })}
        />
        <Checkbox
          id="http_proxy"
          label={<Trans>Use HTTP proxy</Trans>}
          mb="md"
          {...register("http_proxy")}
        />

        <Divider label={<Trans>SSL Config</Trans>} labelPosition="left" my="md" />

        <Checkbox
          id="use_ssl"
          label={<Trans>Use SSL</Trans>}
          mb="md"
          {...register("use_ssl")}
        />
        {useSsl ? (
          <Stack gap="md" mb="md">
            <TextInput
              id="ssl_ca_cert"
              label={<Trans>CA certificate (filename)</Trans>}
              placeholder="/etc/edumfa/ca/ca.crt"
              {...register("ssl_ca_cert")}
            />
            <TextInput
              id="ssl_client_cert"
              label={<Trans>Client certificate (filename)</Trans>}
              placeholder="/etc/edumfa/ca/edumfa.crt"
              {...register("ssl_client_cert")}
            />
            <TextInput
              id="ssl_client_key"
              label={<Trans>Client private key (filename)</Trans>}
              placeholder="/etc/edumfa/ca/edumfa.key"
              {...register("ssl_client_key")}
            />
            <PasswordInput
              autoComplete="new-password"
              id="ssl_client_key_password"
              label={<Trans>Password of encrypted client private key</Trans>}
              placeholder={t`top secret`}
              {...register("ssl_client_key_password")}
            />
          </Stack>
        ) : null}

        <Divider
          label={<Trans>CA specific options</Trans>}
          labelPosition="left"
          my="md"
        />

        <Button
          color="green"
          disabled={hostname === "" || port === ""}
          leftSection={<IconDownload size={16} />}
          loading={optionsQuery.isFetching}
          mb="md"
          onClick={requestSpecificOptions}
          variant="light"
        >
          <Trans>Get available CAs</Trans>
        </Button>

        <ErrorAlert error={optionsQuery.error} />

        {showCaSelect ? (
          <NativeSelect
            data={caOptions}
            id="available_cas"
            label={<Trans>Domain CA</Trans>}
            required
            {...register("ca", { required: true })}
          />
        ) : null}
      </Card>
    </form>
  );
}
