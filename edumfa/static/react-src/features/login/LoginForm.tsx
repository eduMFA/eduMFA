import { Trans, useLingui } from "@lingui/react/macro";
import {
  Anchor,
  Button,
  NativeSelect,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { useState } from "react";

import { buildLoginRequest } from "./loginFlow";
import { LoginLogo } from "./LoginLogo";
import type { AuthLoginRequest } from "@/api/auth";
import { hashHref } from "@/lib/hashbang";
import type { UiConfig } from "@/lib/uiConfig";

export interface LoginFormProps {
  config: UiConfig;
  isPending: boolean;
  logoUrl: string | null;
  onSubmit: (request: AuthLoginRequest) => void;
}

/**
 * The credentials form of `login.html`: username, the realm dropdown of the
 * `realm_dropdown` policy, password and the password reset link.
 */
export function LoginForm({ config, isPending, logoUrl, onSubmit }: LoginFormProps) {
  const { t } = useLingui();
  const [username, setUsername] = useState(config.remoteUser);
  const [realm, setRealm] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = username.length > 0 && password.length > 0;

  return (
    <Paper p="xl" radius="md" withBorder>
      <LoginLogo url={logoUrl} />
      <Title mb="md" order={2} size="h3" ta="center">
        {config.loginText || <Trans>Please sign in</Trans>}
      </Title>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          if (canSubmit) {
            onSubmit(buildLoginRequest({ realm, username }, password));
          }
        }}
        role="form"
      >
        <TextInput
          autoComplete="username"
          autoFocus
          id="username"
          label={<Trans>Username</Trans>}
          mb="sm"
          onChange={(event) => {
            setUsername(event.currentTarget.value);
          }}
          placeholder={t`Username`}
          value={username}
        />
        {config.realms.length > 0 ? (
          <NativeSelect
            data={[{ label: t`Choose a realm...`, value: "" }, ...config.realms]}
            id="realm"
            label={<Trans>Realm</Trans>}
            mb="sm"
            onChange={(event) => {
              setRealm(event.currentTarget.value);
            }}
            value={realm}
          />
        ) : null}
        <PasswordInput
          autoComplete="current-password"
          id="password"
          label={<Trans>Password</Trans>}
          mb="md"
          onChange={(event) => {
            setPassword(event.currentTarget.value);
          }}
          placeholder={t`Password`}
          value={password}
        />
        <Button disabled={!canSubmit} fullWidth loading={isPending} type="submit">
          <Trans>Log In</Trans>
        </Button>
        {config.passwordReset ? (
          <Text mt="sm" size="sm" ta="right">
            <Anchor href={hashHref("/recovery")} size="sm">
              <Trans>Reset Password</Trans>
            </Anchor>
          </Text>
        ) : null}
      </form>
    </Paper>
  );
}
