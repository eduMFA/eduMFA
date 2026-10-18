import { useLingui } from "@lingui/react/macro";
import { Button, Grid, PasswordInput, TextInput } from "@mantine/core";
import { IconPlugConnected } from "@tabler/icons-react";
import type { ReactNode } from "react";

export interface TestCredentialsFieldsProps {
  buttonLabel: ReactNode;
  disabled: boolean;
  isPending: boolean;
  onPasswordChange: (value: string) => void;
  onTest: () => void;
  onUsernameChange: (value: string) => void;
  password: string;
  username: string;
}

/**
 * The "User / Password / Send test request" row the RADIUS and eduMFA
 * server forms share: the credentials are only used for the test request
 * and never stored with the definition.
 */
export function TestCredentialsFields({
  buttonLabel,
  disabled,
  isPending,
  onPasswordChange,
  onTest,
  onUsernameChange,
  password,
  username
}: TestCredentialsFieldsProps) {
  const { t } = useLingui();

  return (
    <Grid align="flex-end">
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <TextInput
          autoComplete="off"
          id="test_username"
          label={t`User`}
          onChange={(event) => {
            onUsernameChange(event.currentTarget.value);
          }}
          value={username}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <PasswordInput
          autoComplete="new-password"
          id="test_password"
          label={t`Password`}
          onChange={(event) => {
            onPasswordChange(event.currentTarget.value);
          }}
          value={password}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Button
          disabled={disabled}
          fullWidth
          leftSection={<IconPlugConnected size={16} />}
          loading={isPending}
          onClick={onTest}
          type="button"
          variant="default"
        >
          {buttonLabel}
        </Button>
      </Grid.Col>
    </Grid>
  );
}
