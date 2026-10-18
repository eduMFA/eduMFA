import { Trans } from "@lingui/react/macro";
import { PasswordInput, TextInput } from "@mantine/core";

import type { SmtpServerFieldSetter, SmtpServerFormValues } from "./smtpServerValues";

export interface SmtpServerAccountFieldsProps {
  setValue: SmtpServerFieldSetter;
  values: SmtpServerFormValues;
}

/** The sender address, the login of the SMTP server and the description. */
export function SmtpServerAccountFields({
  setValue,
  values
}: SmtpServerAccountFieldsProps) {
  return (
    <>
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
    </>
  );
}
