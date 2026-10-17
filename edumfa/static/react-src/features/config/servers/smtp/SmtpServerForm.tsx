import { Trans, useLingui } from "@lingui/react/macro";
import {
  Button,
  Checkbox,
  Grid,
  NumberInput,
  PasswordInput,
  TextInput
} from "@mantine/core";
import { IconDeviceFloppy, IconSend } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { isConfigEnabled } from "@/api/config";
import {
  saveSmtpServer,
  sendTestEmail,
  serverQueryKeys,
  type SmtpServer,
  type SmtpServerRequest,
  type SmtpTestEmailRequest
} from "@/api/servers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  SMTP_IDENTIFIER_PATTERN,
  toNumberField,
  toOptionalInteger,
  toText,
  type NumberFieldValue
} from "@/features/config/servers/serverForm";
import { pushFlash } from "@/lib/flash";
import { notify } from "@/lib/notify";
import { getUiConfig } from "@/lib/uiConfig";

export interface ExistingSmtpServer {
  identifier: string;
  server: SmtpServer;
}

export interface SmtpServerFormProps {
  /** The definition being edited; absent for a new server. */
  existing?: ExistingSmtpServer;
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

function createInitialValues(
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

/**
 * Port of `config.smtp.edit.html`: the definition fields, the StartTLS and
 * job queue switches and the test email row. Saving navigates back to the
 * list like the legacy `$state.go`.
 */
export function SmtpServerForm({ existing }: SmtpServerFormProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "smtpserver_write");
  const { hasJobQueue } = getUiConfig();
  const [values, setValues] = useState(() => createInitialValues(existing));

  const setValue = <TKey extends keyof SmtpServerFormValues>(
    key: TKey,
    value: SmtpServerFormValues[TKey]
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const isIdentifierValid = SMTP_IDENTIFIER_PATTERN.test(values.identifier);
  const identifierError =
    values.identifier !== "" && !isIdentifierValid
      ? t`The resource name must consist of letters, numbers and '_', '-', '.' and must not be the word 'send_test_email'`
      : undefined;
  const isValid = isIdentifierValid && values.server !== "" && values.sender !== "";
  // StartTLS does not apply to implicit TLS; the legacy form hid it for smtps:// servers.
  const showStartTls = !values.server.toLowerCase().startsWith("smtps:");
  // The test endpoint requires the identifier, the server and a recipient.
  const canTest =
    values.identifier !== "" && values.server !== "" && values.recipient !== "";

  const saveMutation = useMutation({
    mutationFn: (request: SmtpServerRequest) => saveSmtpServer(apiClient, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverQueryKeys.smtpServers });
      pushFlash(t`SMTP Config saved.`, "info");
      void navigate("/config/smtp/list");
    }
  });

  const testMutation = useMutation({
    mutationFn: (request: SmtpTestEmailRequest) => sendTestEmail(apiClient, request),
    onSuccess: (delivered) => {
      if (delivered) {
        notify(t`Test Email sent successfully.`, "info");
      }
    }
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (isValid) {
          saveMutation.mutate(buildSmtpServerRequest(values));
        }
      }}
    >
      <PageHeader
        title={
          existing ? (
            <Trans>Edit SMTP server {existing.identifier}</Trans>
          ) : (
            <Trans>Create a new SMTP server {values.identifier}</Trans>
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
              <Trans>Save SMTP server</Trans>
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <TextInput
          autoFocus
          description={
            <Trans>
              This is the unique identifying name of the SMTP server definition.
            </Trans>
          }
          error={identifierError}
          id="identifier"
          label={<Trans>Identifier</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("identifier", event.currentTarget.value);
          }}
          placeholder="mySmtpServer"
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
          placeholder="smtp://mail.example.com"
          required
          value={values.server}
        />
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              allowDecimal={false}
              allowNegative={false}
              id="port"
              label={<Trans>Port</Trans>}
              mb="sm"
              onChange={(value) => {
                setValue("port", value);
              }}
              placeholder="25"
              value={values.port}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              allowDecimal={false}
              allowNegative={false}
              id="timeout"
              label={<Trans>Timeout</Trans>}
              mb="sm"
              onChange={(value) => {
                setValue("timeout", value);
              }}
              placeholder="10"
              value={values.timeout}
            />
          </Grid.Col>
        </Grid>
        <TextInput
          description={
            <Trans>
              This is the email address of the sender. Usually this should be an email
              address identifying your system.
            </Trans>
          }
          id="sender"
          label={<Trans>Sender Email</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("sender", event.currentTarget.value);
          }}
          placeholder="edumfa@example.com"
          required
          value={values.sender}
        />
        <TextInput
          autoComplete="off"
          description={
            <Trans>
              If the SMTP server requires authentication you need to specify the user.
            </Trans>
          }
          id="username"
          label={<Trans>Username</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("username", event.currentTarget.value);
          }}
          placeholder="user@example.com"
          value={values.username}
        />
        <PasswordInput
          autoComplete="new-password"
          id="password"
          label={<Trans>Password</Trans>}
          mb="sm"
          onChange={(event) => {
            setValue("password", event.currentTarget.value);
          }}
          placeholder="topsecret"
          value={values.password}
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
        {showStartTls ? (
          <Checkbox
            checked={values.tls}
            id="tls"
            label={<Trans>Use StartTLS</Trans>}
            mb="sm"
            onChange={(event) => {
              setValue("tls", event.currentTarget.checked);
            }}
          />
        ) : null}
        {hasJobQueue ? (
          <Checkbox
            checked={values.enqueue_job}
            id="enqueue_job"
            label={<Trans>Send mail from job queue</Trans>}
            mb="sm"
            onChange={(event) => {
              setValue("enqueue_job", event.currentTarget.checked);
            }}
          />
        ) : null}
      </Card>

      <Card>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              id="recipient"
              label={<Trans>Recipient for testing</Trans>}
              onChange={(event) => {
                setValue("recipient", event.currentTarget.value);
              }}
              value={values.recipient}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Button
              disabled={!canTest}
              fullWidth
              leftSection={<IconSend size={16} />}
              loading={testMutation.isPending}
              onClick={() => {
                testMutation.mutate({
                  ...buildSmtpServerRequest(values),
                  recipient: values.recipient
                });
              }}
              type="button"
              variant="default"
            >
              <Trans>Send Test Email</Trans>
            </Button>
          </Grid.Col>
        </Grid>
      </Card>
    </form>
  );
}
