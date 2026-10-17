import { Trans, useLingui } from "@lingui/react/macro";
import { Button, Checkbox, TextInput } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { isConfigEnabled } from "@/api/config";
import {
  saveEduMfaServer,
  serverQueryKeys,
  testEduMfaServerRequest,
  type EduMfaServer,
  type EduMfaServerRequest,
  type EduMfaServerTestRequest
} from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  TEST_REQUEST_IDENTIFIER_PATTERN,
  toText
} from "@/features/config/servers/serverForm";
import { TestCredentialsFields } from "@/features/config/servers/TestCredentialsFields";
import { pushFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";

export interface ExistingEduMfaServer {
  identifier: string;
  server: EduMfaServer;
}

export interface EduMfaServerFormProps {
  /** The definition being edited; absent for a new server. */
  existing?: ExistingEduMfaServer;
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

function createInitialValues(
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

/**
 * Port of `config.edumfaserver.edit.html`: the definition fields and the
 * test request row. Saving navigates back to the list like the legacy
 * `$state.go`.
 */
export function EduMfaServerForm({ existing }: EduMfaServerFormProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "edumfaserver_write");
  const [values, setValues] = useState(() => createInitialValues(existing));

  const setValue = <TKey extends keyof EduMfaServerFormValues>(
    key: TKey,
    value: EduMfaServerFormValues[TKey]
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const isIdentifierValid = TEST_REQUEST_IDENTIFIER_PATTERN.test(values.identifier);
  const identifierError =
    values.identifier !== "" && !isIdentifierValid
      ? t`The resource name must consist of letters, numbers and '_', '-', '.' and must not be the word 'test_request'`
      : undefined;
  const isValid = isIdentifierValid && values.url !== "";
  // The test endpoint additionally requires the credentials to try.
  const canTest = isValid && values.username !== "" && values.password !== "";

  const saveMutation = useMutation({
    mutationFn: (request: EduMfaServerRequest) => saveEduMfaServer(apiClient, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.eduMfaServers });
      pushFlash(t`eduMFA Server Config saved.`, "info");
      void navigate("/config/edumfaserver/list");
    }
  });

  const testMutation = useMutation({
    mutationFn: (request: EduMfaServerTestRequest) =>
      testEduMfaServerRequest(apiClient, request),
    onSuccess: (accepted) => {
      if (accepted) {
        notify(t`Request to remote eduMFA server successful.`, "success");
      } else {
        notify(
          t`Request to remote eduMFA server not successful. Check the fields URL, username and password for correctness.`,
          "danger"
        );
      }
    }
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (isValid) {
          saveMutation.mutate(buildEduMfaServerRequest(values));
        }
      }}
    >
      <PageHeader
        title={
          existing ? (
            <Trans>Edit eduMFA server {existing.identifier}</Trans>
          ) : (
            <Trans>Create a new eduMFA server {values.identifier}</Trans>
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
              <Trans>Save eduMFA server</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <TextInput
          autoFocus
          description={
            <Trans>
              This is the unique identifying name of the eduMFA server definition.
            </Trans>
          }
          error={identifierError}
          id="identifier"
          label={<Trans>Identifier</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("identifier", event.currentTarget.value);
          }}
          placeholder="Remote eduMFA Server"
          required
          value={values.identifier}
        />
        <TextInput
          description={<Trans>Please provide the base URL of the eduMFA server.</Trans>}
          id="url"
          label={<Trans>URL of the eduMFA server</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("url", event.currentTarget.value);
          }}
          placeholder="https://mfa.example.com/"
          required
          value={values.url}
        />
        <Checkbox
          checked={values.tls}
          description={
            <Trans>
              The certificate will be checked for a valid hostname and for a trusted
              certificate. Do not uncheck this in productive use!
            </Trans>
          }
          id="tls"
          label={<Trans>Verify the certificate</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("tls", event.currentTarget.checked);
          }}
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
          buttonLabel={<Trans>Send test request to eduMFA server</Trans>}
          disabled={!canTest}
          isPending={testMutation.isPending}
          onPasswordChange={(value) => {
            setValue("password", value);
          }}
          onTest={() => {
            testMutation.mutate({
              ...buildEduMfaServerRequest(values),
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
