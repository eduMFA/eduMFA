import { Trans } from "@lingui/react/macro";
import { Button, Paper, Stack, Text, Title } from "@mantine/core";

import { LoginLogo } from "./LoginLogo";
import type { UiConfig } from "@/lib/uiConfig";

export interface RemoteUserLoginCardProps {
  config: UiConfig;
  isPending: boolean;
  logoUrl: string | null;
  /** Logs in as the web server user without credentials. */
  onLogin: () => void;
  /** Switches to the credentials form (not offered with `remote_user=force`). */
  onUseCredentials: () => void;
}

/** The "Login as <web server user>" card of `login.html` (`REMOTE_USER`). */
export function RemoteUserLoginCard({
  config,
  isPending,
  logoUrl,
  onLogin,
  onUseCredentials
}: RemoteUserLoginCardProps) {
  return (
    <Paper p="xl" radius="md" withBorder>
      <LoginLogo url={logoUrl} />
      <Title mb="md" order={2} size="h3" ta="center">
        <Trans>Login as {config.remoteUser}</Trans>
      </Title>
      <Text mb="md">
        <Trans>
          You are authenticated by the web server as user <b>{config.remoteUser}</b>.
          You may login as this user to eduMFA without any further credentials.
        </Trans>
      </Text>
      <Stack gap="xs">
        <Button fullWidth loading={isPending} onClick={onLogin}>
          <Trans>Log In</Trans>
        </Button>
        {config.forceRemoteUser ? null : (
          <Button fullWidth onClick={onUseCredentials} variant="light">
            <Trans>Login with credentials</Trans>
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
