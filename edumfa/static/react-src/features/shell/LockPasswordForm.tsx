import { useLingui } from "@lingui/react/macro";
import { Button, PasswordInput, Text } from "@mantine/core";
import { useState, type ReactNode } from "react";

export interface LockPasswordFormProps {
  isPending: boolean;
  loginMessage: ReactNode;
  onSubmit: (password: string) => void;
}

/**
 * The password step of the lock dialog. The field's state lives here, inside
 * the modal body, so it is discarded whenever the dialog closes; like the
 * legacy controller the value is also cleared as soon as it has been sent.
 */
export function LockPasswordForm({
  isPending,
  loginMessage,
  onSubmit
}: LockPasswordFormProps) {
  const { t } = useLingui();
  const [password, setPassword] = useState("");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (password.length > 0) {
          onSubmit(password);
          setPassword("");
        }
      }}
      role="form"
    >
      <Text mb="md" size="sm" ta="center">
        {loginMessage}
      </Text>
      <PasswordInput
        autoComplete="current-password"
        autoFocus
        id="lockPassword"
        label={t`Password`}
        mb="md"
        onChange={(event) => {
          setPassword(event.currentTarget.value);
        }}
        placeholder={t`Password`}
        value={password}
      />
      <Button
        disabled={password.length === 0}
        fullWidth
        loading={isPending}
        type="submit"
      >
        {t`Log In`}
      </Button>
    </form>
  );
}
