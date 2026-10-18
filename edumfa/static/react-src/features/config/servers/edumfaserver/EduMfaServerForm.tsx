import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";

import { EduMfaServerFields } from "./EduMfaServerFields";
import {
  buildEduMfaServerRequest,
  createEduMfaServerValues,
  type EduMfaServerFieldSetter,
  type ExistingEduMfaServer
} from "./eduMfaServerValues";
import { EduMfaTestRequestCard } from "./EduMfaTestRequestCard";
import { useEduMfaServerMutations } from "./useEduMfaServerMutations";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { TEST_REQUEST_IDENTIFIER_PATTERN } from "@/features/config/servers/serverForm";

export interface EduMfaServerFormProps {
  /** The definition being edited; absent for a new server. */
  existing?: ExistingEduMfaServer;
}

/**
 * Port of `config.edumfaserver.edit.html`: the definition fields and the
 * test request row. Saving navigates back to the list like the legacy
 * `$state.go`.
 */
export function EduMfaServerForm({ existing }: EduMfaServerFormProps) {
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "edumfaserver_write");
  const [values, setValues] = useState(() => createEduMfaServerValues(existing));
  const { saveMutation, testMutation } = useEduMfaServerMutations();

  const setValue: EduMfaServerFieldSetter = (key, value) => {
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
        <EduMfaServerFields
          identifierError={identifierError}
          setValue={setValue}
          values={values}
        />
      </Card>

      <EduMfaTestRequestCard
        canTest={canTest}
        isPending={testMutation.isPending}
        onTest={() => {
          testMutation.mutate({
            ...buildEduMfaServerRequest(values),
            password: values.password,
            username: values.username
          });
        }}
        setValue={setValue}
        values={values}
      />
    </form>
  );
}
