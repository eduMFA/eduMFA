import { useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  return (
    <>
      <TextInput
        description={t`This is the email address of the sender. Usually this should be an email address identifying your system.`}
        id="sender"
        label={t`Sender Email`}
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
        description={t`If the SMTP server requires authentication you need to specify the user.`}
        id="username"
        label={t`Username`}
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
        label={t`Password`}
        mb="sm"
        onChange={(event) => {
          setValue("password", event.currentTarget.value);
        }}
        placeholder="topsecret"
        value={values.password}
      />
      <TextInput
        id="description"
        label={t`Description`}
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
