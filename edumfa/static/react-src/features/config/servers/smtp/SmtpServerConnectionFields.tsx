import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <>
      <TextInput
        autoFocus
        description={t`This is the unique identifying name of the SMTP server definition.`}
        error={identifierError}
        id="identifier"
        label={t`Identifier`}
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
        label={t`IP or FQDN`}
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
            label={t`Port`}
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
            label={t`Timeout`}
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
