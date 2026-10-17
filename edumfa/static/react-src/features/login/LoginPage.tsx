import { Trans, useLingui } from "@lingui/react/macro";
import {
  Alert,
  Anchor,
  Button,
  NativeSelect,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { LoginLogo, LoginShell } from "./LoginShell";
import { useAuthenticate } from "./useAuthenticate";
import type { AuthLoginRequest } from "@/api/auth";
import { popFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";
import { notify } from "@/lib/notify";
import { getUiConfig } from "@/lib/uiConfig";

/**
 * Port of `login.html`: the credentials form with the optional realm
 * dropdown, or the "Login as <web server user>" card. A successful login is
 * handed to the Angular controller (`useAuthenticate`); a challenge moves on
 * to `/response`.
 */
export function LoginPage() {
  const { t } = useLingui();
  const [config] = useState(() => getUiConfig());
  const logoUrl = config.logo
    ? `${config.instanceUrl}/static/css/${config.logo}`
    : null;
  const [withCredentials, setWithCredentials] = useState(
    () => config.remoteUser === ""
  );
  const [showHint, setShowHint] = useState(true);
  const [username, setUsername] = useState(config.remoteUser);
  const [realm, setRealm] = useState("");
  const [password, setPassword] = useState("");
  const authenticateMutation = useAuthenticate({ step: "login" });
  const canSubmit = username.length > 0 && password.length > 0;

  // Notices handed over by the PIN change page ("PIN changed successfully.").
  useEffect(() => {
    const flash = popFlash();

    if (flash) {
      notify(flash.message, flash.type);
    }
  }, []);

  if (!config.hsmReady) {
    return (
      <LoginShell>
        <Alert color="red" role="alert" variant="light">
          <Trans>
            The HSM is not ready. eduMFA can not work properly. Please start the HSM and
            reload this page.
          </Trans>
        </Alert>
      </LoginShell>
    );
  }

  if (!withCredentials) {
    return (
      <LoginShell>
        <Paper p="xl" radius="md" withBorder>
          <LoginLogo url={logoUrl} />
          <Title mb="md" order={2} size="h3" ta="center">
            <Trans>Login as {config.remoteUser}</Trans>
          </Title>
          <Text mb="md">
            <Trans>
              You are authenticated by the web server as user <b>{config.remoteUser}</b>
              . You may login as this user to eduMFA without any further credentials.
            </Trans>
          </Text>
          <Stack gap="xs">
            <Button
              fullWidth
              loading={authenticateMutation.isPending}
              onClick={() => {
                authenticateMutation.mutate({
                  password: "",
                  username: config.remoteUser
                });
              }}
            >
              <Trans>Log In</Trans>
            </Button>
            {config.forceRemoteUser ? null : (
              <Button
                fullWidth
                onClick={() => {
                  setWithCredentials(true);
                }}
                variant="light"
              >
                <Trans>Login with credentials</Trans>
              </Button>
            )}
          </Stack>
        </Paper>
      </LoginShell>
    );
  }

  const submit = () => {
    if (!canSubmit) {
      return;
    }

    const request: AuthLoginRequest = { password, username };

    if (realm) {
      request.realm = realm;
    }

    authenticateMutation.mutate(request);
  };

  return (
    <LoginShell>
      {showHint ? (
        <Alert
          icon={<IconInfoCircle size={18} />}
          mb="md"
          onClose={() => {
            setShowHint(false);
          }}
          variant="light"
          withCloseButton
        >
          <Trans>
            Enter your username and password and click Log In to authenticate.
          </Trans>
        </Alert>
      ) : null}
      <Paper p="xl" radius="md" withBorder>
        <LoginLogo url={logoUrl} />
        <Title mb="md" order={2} size="h3" ta="center">
          {config.loginText || <Trans>Please sign in</Trans>}
        </Title>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
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
          <Button
            disabled={!canSubmit}
            fullWidth
            loading={authenticateMutation.isPending}
            type="submit"
          >
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
    </LoginShell>
  );
}
