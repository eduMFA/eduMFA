import { Trans, useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";

import { RadiusServerConnectionFields } from "./RadiusServerConnectionFields";
import { RadiusServerSecretFields } from "./RadiusServerSecretFields";
import { RadiusServerTimingFields } from "./RadiusServerTimingFields";
import {
  buildRadiusServerRequest,
  createRadiusServerValues,
  type ExistingRadiusServer,
  type RadiusServerFieldSetter
} from "./radiusServerValues";
import { RadiusTestRequestCard } from "./RadiusTestRequestCard";
import { useRadiusServerMutations } from "./useRadiusServerMutations";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { TEST_REQUEST_IDENTIFIER_PATTERN } from "@/features/config/servers/serverForm";

export interface RadiusServerFormProps {
  /** The definition being edited; absent for a new server. */
  existing?: ExistingRadiusServer;
}

/**
 * Port of `config.radius.edit.html`: the definition fields and the test
 * request row. Saving navigates back to the list like the legacy `$state.go`.
 */
export function RadiusServerForm({ existing }: RadiusServerFormProps) {
  const { t } = useLingui();
  const { rights } = useAuth();
  const canWrite = hasRight(rights, "radiusserver_write");
  const [values, setValues] = useState(() => createRadiusServerValues(existing));
  const { saveMutation, testMutation } = useRadiusServerMutations();

  const setValue: RadiusServerFieldSetter = (key, value) => {
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
              {t`Save RADIUS server`}
            </Button>
          ) : null
        }
        footerAlign="center"
      >
        <RadiusServerConnectionFields
          identifierError={identifierError}
          setValue={setValue}
          values={values}
        />
        <RadiusServerTimingFields setValue={setValue} values={values} />
        <RadiusServerSecretFields
          isEditing={existing !== undefined}
          setValue={setValue}
          values={values}
        />
      </Card>

      <RadiusTestRequestCard
        canTest={canTest}
        isPending={testMutation.isPending}
        onTest={() => {
          testMutation.mutate({
            ...buildRadiusServerRequest(values),
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
