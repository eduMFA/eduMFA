import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";

import { SmtpServerAccountFields } from "./SmtpServerAccountFields";
import { SmtpServerConnectionFields } from "./SmtpServerConnectionFields";
import { SmtpServerOptionFields } from "./SmtpServerOptionFields";
import {
  buildSmtpServerRequest,
  createSmtpServerValues,
  type ExistingSmtpServer,
  type SmtpServerFieldSetter
} from "./smtpServerValues";
import { SmtpTestEmailCard } from "./SmtpTestEmailCard";
import { useSmtpServerMutations } from "./useSmtpServerMutations";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SMTP_IDENTIFIER_PATTERN } from "@/features/config/servers/serverForm";

export interface SmtpServerFormProps {
  /** The definition being edited; absent for a new server. */
  existing?: ExistingSmtpServer;
}

/**
 * Port of `config.smtp.edit.html`: the definition fields, the StartTLS and
 * job queue switches and the test email row. Saving navigates back to the
 * list like the legacy `$state.go`.
 */
export function SmtpServerForm({ existing }: SmtpServerFormProps) {
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "smtpserver_write");
  const [values, setValues] = useState(() => createSmtpServerValues(existing));
  const { saveMutation, testMutation } = useSmtpServerMutations();

  const setValue: SmtpServerFieldSetter = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const isIdentifierValid = SMTP_IDENTIFIER_PATTERN.test(values.identifier);
  const identifierError =
    values.identifier !== "" && !isIdentifierValid
      ? t`The resource name must consist of letters, numbers and '_', '-', '.' and must not be the word 'send_test_email'`
      : undefined;
  const isValid = isIdentifierValid && values.server !== "" && values.sender !== "";
  // The test endpoint requires the identifier, the server and a recipient.
  const canTest =
    values.identifier !== "" && values.server !== "" && values.recipient !== "";

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
        <SmtpServerConnectionFields
          identifierError={identifierError}
          setValue={setValue}
          values={values}
        />
        <SmtpServerAccountFields setValue={setValue} values={values} />
        <SmtpServerOptionFields setValue={setValue} values={values} />
      </Card>

      <SmtpTestEmailCard
        canTest={canTest}
        isPending={testMutation.isPending}
        onRecipientChange={(value) => {
          setValue("recipient", value);
        }}
        onTest={() => {
          testMutation.mutate({
            ...buildSmtpServerRequest(values),
            recipient: values.recipient
          });
        }}
        recipient={values.recipient}
      />
    </form>
  );
}
