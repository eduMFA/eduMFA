import { Trans, useLingui } from "@lingui/react/macro";
import {
  Alert,
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Text,
  Title
} from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { setPendingPinChange, useLoginFlow } from "./loginFlowStore";
import { LoginShell } from "./LoginShell";
import { useApiClient } from "@/api/ApiClientProvider";
import { setTokenPin } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { pushFlash } from "@/lib/flash";
import { hashHref } from "@/lib/hashbang";

/**
 * Port of `pinchange.html`: a login whose token PIN expired lands here, sets
 * a new PIN and is logged out again, so the next login uses it.
 */
export function PinChangePage() {
  const apiClient = useApiClient();
  const navigate = useNavigate();
  const { t } = useLingui();
  const { logout } = useAuth();
  const { pinChange } = useLoginFlow();
  const [pin, setPin] = useState("");
  const [pinRepeat, setPinRepeat] = useState("");
  const changePinMutation = useMutation({
    mutationFn: (serial: string) => setTokenPin(apiClient, serial, "otppin", pin),
    onSuccess: () => {
      setPendingPinChange(null);
      pushFlash(t`PIN changed successfully.`, "success");
      logout();
      void navigate("/login");
    }
  });
  const mismatch = pinRepeat.length > 0 && pin !== pinRepeat;
  const canSubmit = pin.length > 0 && pin === pinRepeat;

  if (!pinChange) {
    return (
      <LoginShell>
        <Alert color="yellow" role="alert" variant="light">
          <Trans>
            No PIN change is pending. Continue to the{" "}
            <Anchor href={hashHref("/token/list")} inherit>
              token list
            </Anchor>
            .
          </Trans>
        </Alert>
      </LoginShell>
    );
  }

  const serial = pinChange.serial;

  return (
    <LoginShell>
      <ErrorAlert error={changePinMutation.error} />
      <Paper p="xl" radius="md" withBorder>
        <Title mb="md" order={2} size="h3" ta="center">
          <Trans>Change PIN</Trans>
        </Title>
        <Text c="dimmed" mb="md" size="sm">
          <Trans>
            Your token PIN has expired. You need to set a new PIN for token {serial}.
          </Trans>
        </Text>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            if (canSubmit) {
              changePinMutation.mutate(serial);
            }
          }}
          role="form"
        >
          <PasswordInput
            autoComplete="new-password"
            autoFocus
            id="pin1"
            label={<Trans>New PIN</Trans>}
            mb="sm"
            onChange={(event) => {
              setPin(event.currentTarget.value);
            }}
            placeholder={t`New PIN`}
            value={pin}
          />
          <PasswordInput
            autoComplete="new-password"
            error={mismatch && t`The PINs do not match.`}
            id="pin2"
            label={<Trans>Repeat new PIN</Trans>}
            mb="md"
            onChange={(event) => {
              setPinRepeat(event.currentTarget.value);
            }}
            placeholder={t`Repeat new PIN`}
            value={pinRepeat}
          />
          <Button
            disabled={!canSubmit}
            fullWidth
            loading={changePinMutation.isPending}
            type="submit"
          >
            <Trans>Change PIN</Trans>
          </Button>
        </form>
      </Paper>
    </LoginShell>
  );
}
