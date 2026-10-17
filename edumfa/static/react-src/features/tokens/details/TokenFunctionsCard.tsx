import { Trans, useLingui } from "@lingui/react/macro";
import {
  Button,
  Checkbox,
  Group,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import { IconKey, IconQuestionMark, IconRefresh } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import { configQueryKeys, getSystemConfig, isConfigEnabled } from "@/api/config";
import { resyncToken, setRandomPin, setTokenPin, type TokenDetail } from "@/api/tokens";
import { checkToken } from "@/api/validate";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { notify } from "@/lib/notify";

export interface TokenFunctionsCardProps {
  onRefresh: () => Promise<void>;
  serial: string;
  token: TokenDetail;
}

/**
 * Port of the "token functions" rows in `token.details.html`: resync, set
 * PIN, random PIN and the test authentication. Nothing is offered for a
 * locked token.
 */
export function TokenFunctionsCard({
  onRefresh,
  serial,
  token
}: TokenFunctionsCardProps) {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated, rights } = useAuth();
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [randomPin, setRandomPinValue] = useState<string | null>(null);
  const [testPassword, setTestPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const canResync =
    !["registration", "spass"].includes(token.tokentype) && hasRight(rights, "resync");
  const canSetPin = hasRight(rights, "setpin");
  const canSetRandomPin = hasRight(rights, "setrandompin");
  const canTest = token.tokentype !== "registration";

  // The placeholder tells whether the PIN is typed before or after the OTP.
  const systemConfigQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: ({ signal }) => getSystemConfig(apiClient, signal),
    queryKey: configQueryKeys.system
  });
  const prependPin = isConfigEnabled(systemConfigQuery.data?.PrependPin);
  const testPlaceholder = prependPin
    ? t`Enter PIN and OTP to check the token.`
    : t`Enter OTP + PIN to check the token.`;

  const resyncMutation = useMutation({
    mutationFn: () => resyncToken(apiClient, { otp1, otp2, serial }),
    onSuccess: async (resynced) => {
      setOtp1("");
      setOtp2("");
      notify(
        resynced ? t`Token resync successful.` : t`Token resync failed.`,
        resynced ? "info" : "danger"
      );
      await onRefresh();
    }
  });
  const setPinMutation = useMutation({
    mutationFn: () => setTokenPin(apiClient, serial, "otppin", pin1),
    onSuccess: async (count) => {
      setPin1("");
      setPin2("");
      notify(
        count >= 1 ? t`PIN set successfully.` : t`Failed to set PIN.`,
        count >= 1 ? "info" : "danger"
      );

      // The PKCS12 of a certificate token is encrypted with the new PIN.
      if (token.tokentype === "certificate") {
        await onRefresh();
      }
    }
  });
  const randomPinMutation = useMutation({
    mutationFn: () => setRandomPin(apiClient, serial),
    onSuccess: (result) => {
      notify(
        result.value >= 1 ? t`PIN set successfully.` : t`Failed to set PIN.`,
        result.value >= 1 ? "info" : "danger"
      );
      setRandomPinValue(result.pin);
    }
  });
  const testMutation = useMutation({
    mutationFn: (otpOnly: boolean) =>
      checkToken(apiClient, {
        pass: testPassword,
        serial,
        ...(otpOnly ? { otponly: "1" } : {})
      }),
    onSuccess: async (result) => {
      await onRefresh();

      if (result.success) {
        notify(t`Successfully authenticated.`, "success");
      } else {
        notify(result.message || t`Authentication failed.`, "danger");
      }
    }
  });

  if (token.locked) {
    return null;
  }

  return (
    <Card title={<Trans>Token functions</Trans>}>
      <ErrorAlert error={resyncMutation.error} />
      <ErrorAlert error={setPinMutation.error} />
      <ErrorAlert error={randomPinMutation.error} />
      <ErrorAlert error={testMutation.error} />

      <Stack gap="lg">
        {canResync ? (
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
            <TextInput
              aria-label={t`Enter first OTP value`}
              autoComplete="off"
              onChange={(event) => {
                setOtp1(event.currentTarget.value);
              }}
              placeholder={t`Enter first OTP value`}
              value={otp1}
            />
            <TextInput
              aria-label={t`Enter second OTP value`}
              autoComplete="off"
              onChange={(event) => {
                setOtp2(event.currentTarget.value);
              }}
              placeholder={t`Enter second OTP value`}
              value={otp2}
            />
            <Group>
              <Button
                disabled={otp1.length === 0 || otp2.length === 0}
                id="resyncButton"
                leftSection={<IconRefresh size={16} />}
                loading={resyncMutation.isPending}
                onClick={() => {
                  resyncMutation.mutate();
                }}
              >
                <Trans>Resync Token</Trans>
              </Button>
            </Group>
          </SimpleGrid>
        ) : null}

        {canSetPin ? (
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
            <PasswordInput
              aria-label={t`Enter PIN for token`}
              autoComplete="new-password"
              onChange={(event) => {
                setPin1(event.currentTarget.value);
              }}
              placeholder={t`Enter PIN for token`}
              value={pin1}
            />
            <PasswordInput
              aria-label={t`Enter PIN again`}
              autoComplete="new-password"
              error={pin1 === pin2 ? undefined : t`The PINs do not match.`}
              onChange={(event) => {
                setPin2(event.currentTarget.value);
              }}
              placeholder={t`Enter PIN again`}
              value={pin2}
            />
            <Group>
              <Button
                disabled={pin1 !== pin2}
                id="setPinButton"
                leftSection={<IconKey size={16} />}
                loading={setPinMutation.isPending}
                onClick={() => {
                  setPinMutation.mutate();
                }}
              >
                <Trans>Set PIN</Trans>
              </Button>
            </Group>
          </SimpleGrid>
        ) : null}

        {canSetRandomPin ? (
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
            <Text fw={600} size="sm">
              {randomPin === null ? null : <Trans>Random generated PIN</Trans>}
            </Text>
            <Text data-field="randomPin" ff="monospace" size="sm">
              {randomPin}
            </Text>
            <Group>
              <Button
                id="setRandomPinButton"
                leftSection={<IconKey size={16} />}
                loading={randomPinMutation.isPending}
                onClick={() => {
                  randomPinMutation.mutate();
                }}
              >
                <Trans>Set random PIN</Trans>
              </Button>
            </Group>
          </SimpleGrid>
        ) : null}

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
          <Checkbox
            checked={showPassword}
            id="showPassword"
            label={<Trans>Show password</Trans>}
            onChange={(event) => {
              setShowPassword(event.currentTarget.checked);
            }}
          />
          {canTest ? (
            showPassword ? (
              <TextInput
                aria-label={t`Test password`}
                autoComplete="off"
                id="testPassword"
                onChange={(event) => {
                  setTestPassword(event.currentTarget.value);
                }}
                placeholder={testPlaceholder}
                value={testPassword}
              />
            ) : (
              <PasswordInput
                aria-label={t`Test password`}
                autoComplete="new-password"
                id="testPassword"
                onChange={(event) => {
                  setTestPassword(event.currentTarget.value);
                }}
                placeholder={testPlaceholder}
                value={testPassword}
              />
            )
          ) : (
            <span />
          )}
          <Group gap="xs">
            <Button
              disabled={testPassword.length === 0}
              id="testOtpButton"
              leftSection={<IconQuestionMark size={16} />}
              loading={testMutation.isPending}
              onClick={() => {
                testMutation.mutate(false);
              }}
              title={t`Check with OTP PIN.`}
            >
              <Trans>Test token</Trans>
            </Button>
            <Button
              disabled={testPassword.length === 0}
              id="testOtpOnlyButton"
              leftSection={<IconQuestionMark size={16} />}
              loading={testMutation.isPending}
              onClick={() => {
                testMutation.mutate(true);
              }}
              title={t`Check OTP only.`}
              variant="default"
            >
              <Trans>Test OTP only</Trans>
            </Button>
          </Group>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
