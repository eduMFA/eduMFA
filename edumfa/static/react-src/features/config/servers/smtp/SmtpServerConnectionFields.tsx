import { Trans } from "@lingui/react/macro";
import { Grid, NumberInput, TextInput } from "@mantine/core";

import type { SmtpServerFieldSetter, SmtpServerFormValues } from "./smtpServerValues";

export interface SmtpServerConnectionFieldsProps {
  identifierError: string | undefined;
  setValue: SmtpServerFieldSetter;
  values: SmtpServerFormValues;
}

/** The identifier, the server and its port and timeout. */
export function SmtpServerConnectionFields({
  identifierError,
  setValue,
  values
}: SmtpServerConnectionFieldsProps) {
  return (
    <>
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
    </>
  );
}
