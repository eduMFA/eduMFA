import { Trans, useLingui } from "@lingui/react/macro";
import {
  Button,
  Checkbox,
  Grid,
  NumberInput,
  PasswordInput,
  TextInput
} from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  saveRadiusServer,
  serverQueryKeys,
  testRadiusRequest,
  type RadiusServer,
  type RadiusServerRequest,
  type RadiusTestRequest
} from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  TEST_REQUEST_IDENTIFIER_PATTERN,
  toNumberField,
  toOptionalInteger,
  toText,
  type NumberFieldValue
} from "@/features/config/servers/serverForm";
import { TestCredentialsFields } from "@/features/config/servers/TestCredentialsFields";
import { pushFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

export interface ExistingRadiusServer {
  identifier: string;
  server: RadiusServer;
}

export interface RadiusServerFormProps {
  /** The definition being edited; absent for a new server. */
  existing?: ExistingRadiusServer;
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

function createInitialValues(
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

/**
 * Port of `config.radius.edit.html`: the definition fields and the test
 * request row. Saving navigates back to the list like the legacy `$state.go`.
 */
export function RadiusServerForm({ existing }: RadiusServerFormProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "radiusserver_write");
  const [values, setValues] = useState(() => createInitialValues(existing));

  const setValue = <TKey extends keyof RadiusServerFormValues>(
    key: TKey,
    value: RadiusServerFormValues[TKey]
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const isIdentifierValid = TEST_REQUEST_IDENTIFIER_PATTERN.test(values.identifier);
  const identifierError =
    values.identifier !== "" && !isIdentifierValid
      ? t`The resource name must consist of letters, numbers and '_', '-', '.' and must not be the word 'test_request'`
      : undefined;
  const isValid = isIdentifierValid && values.server !== "" && values.secret !== "";
  // The test endpoint additionally requires the credentials to try.
  const canTest = isValid && values.username !== "" && values.password !== "";

  const saveMutation = useMutation({
    mutationFn: (request: RadiusServerRequest) => saveRadiusServer(apiClient, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.radiusServers });
      pushFlash(t`RADIUS Config saved.`, "info");
      void navigate("/config/radius/list");
    }
  });

  const testMutation = useMutation({
    mutationFn: (request: RadiusTestRequest) => testRadiusRequest(apiClient, request),
    onSuccess: (accepted) => {
      if (accepted) {
        notify(t`RADIUS request successful.`, "success");
      } else {
        notify(t`RADIUS request failed!`, "danger");
      }
    }
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (isValid) {
          saveMutation.mutate(buildRadiusServerRequest(values));
        }
      }}
    >
      <PageHeader
        title={
          existing ? (
            <Trans>Edit RADIUS server {existing.identifier}</Trans>
          ) : (
            <Trans>Create a new RADIUS server {values.identifier}</Trans>
          )
        }
      />

      <ErrorAlert error={saveMutation.error} />
      <ErrorAlert error={testMutation.error} />

      <Card
        footer={
          canWrite ? (
            <Button
              disabled={!isValid}
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saveMutation.isPending}
              type="submit"
            >
              <Trans>Save RADIUS server</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <TextInput
          autoFocus
          description={
            <Trans>
              This is the unique identifying name of the RADIUS server definition.
            </Trans>
          }
          error={identifierError}
          id="identifier"
          label={<Trans>Identifier</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("identifier", event.currentTarget.value);
          }}
          placeholder="myRadiusServer"
          required
          value={values.identifier}
        />
        <TextInput
          id="server"
          label={<Trans>IP or FQDN</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("server", event.currentTarget.value);
          }}
          placeholder="1.2.3.4"
          required
          value={values.server}
        />
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput
              allowDecimal={false}
              allowNegative={false}
              id="port"
              label={<Trans>Port</Trans>}
              mb="sm"
              onChange={(value) => {
                setValue("port", value);
              }}
              placeholder="1812"
              value={values.port}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput
              allowDecimal={false}
              allowNegative={false}
              id="timeout"
              label={<Trans>Timeout</Trans>}
              mb="sm"
              onChange={(value) => {
                setValue("timeout", value);
              }}
              placeholder="5"
              value={values.timeout}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput
              allowDecimal={false}
              allowNegative={false}
              id="retries"
              label={<Trans>Retries</Trans>}
              mb="sm"
              onChange={(value) => {
                setValue("retries", value);
              }}
              placeholder="3"
              value={values.retries}
            />
          </Grid.Col>
        </Grid>
        <Checkbox
          checked={values.enforce_ma}
          description={<Trans>Enforce usage of Message-Authenticator attribute</Trans>}
          id="enforce_ma"
          label={<Trans>Enforce Message-Authenticator</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("enforce_ma", event.currentTarget.checked);
          }}
        />
        <PasswordInput
          autoComplete="new-password"
          description={
            existing ? (
              <Trans>
                The stored secret is not shown. Enter it again to save the definition.
              </Trans>
            ) : null
          }
          id="secret"
          label={<Trans>Secret</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("secret", event.currentTarget.value);
          }}
          placeholder="testing123"
          required
          value={values.secret}
        />
        <TextInput
          id="dictionary"
          label={<Trans>Dictionary</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("dictionary", event.currentTarget.value);
          }}
          placeholder="/etc/edumfa/dictionary"
          value={values.dictionary}
        />
        <TextInput
          id="description"
          label={<Trans>Description</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("description", event.currentTarget.value);
          }}
          placeholder="some wise words"
          value={values.description}
        />
      </Card>

      <Card>
        <TestCredentialsFields
          buttonLabel={<Trans>Send test RADIUS request</Trans>}
          disabled={!canTest}
          isPending={testMutation.isPending}
          onPasswordChange={(value) => {
            setValue("password", value);
          }}
          onTest={() => {
            testMutation.mutate({
              ...buildRadiusServerRequest(values),
              password: values.password,
              username: values.username
            });
          }}
          onUsernameChange={(value) => {
            setValue("username", value);
          }}
          password={values.password}
          username={values.username}
        />
      </Card>
    </form>
  );
}
