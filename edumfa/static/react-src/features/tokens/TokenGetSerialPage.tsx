import { Trans, useLingui } from "@lingui/react/macro";
import { Alert, Anchor, Button, Group, NativeSelect, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconCircleCheck, IconSearch } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { TokenSidebar } from "./TokenSidebar";
import { useApiClient } from "@/api/ApiClientProvider";
import { getSerialByOtp, type TokenSerialLookupResponse } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { hashHref } from "@/lib/hashbang";

/**
 * "init" shows the form, "count" asks whether to run the (possibly slow)
 * search over the counted tokens, "found" shows the result.
 */
type LookupStep = "count" | "found" | "init";

type AssignmentFilter = "" | "assigned" | "unassigned";

/**
 * Searchable token types, as hard-coded in the legacy controller. The
 * descriptions are product names and were never translated there either.
 */
const tokenTypeOptions = [
  { label: "HOTP: event based One Time Passwords", value: "hotp" },
  { label: "TOTP: time based One Time Passwords", value: "totp" },
  { label: "SPass: Simple Pass token. Static passwords", value: "spass" },
  { label: "mOTP: classical mobile One Time Passwords", value: "motp" },
  { label: "SSH Public Key: The public SSH key", value: "sshkey" },
  { label: "Yubikey AES mode: One Time Passwords with Yubikey", value: "yubikey" },
  {
    label: "Remote Token: Forward authentication request to another server",
    value: "remote"
  },
  {
    label: "Yubikey Cloud mode: Forward authentication request to YubiCloud",
    value: "yubico"
  },
  {
    label: "RADIUS: Forward authentication request to a RADIUS server",
    value: "radius"
  },
  { label: "SMS: Send a One Time Password to the users mobile phone", value: "sms" }
];

/**
 * Port of `token.getserial.html`: finds the token that produced an OTP
 * value. The backend is asked for the number of candidate tokens first
 * (`count=1`), so the administrator can narrow the search before running it.
 */
export function TokenGetSerialPage() {
  const apiClient = useApiClient();
  const { t } = useLingui();
  const { isAuthenticated } = useAuth();
  const [otp, setOtp] = useState("");
  const [tokenType, setTokenType] = useState("");
  const [assignment, setAssignment] = useState<AssignmentFilter>("");
  const [serialSubstring, setSerialSubstring] = useState("");
  const [countWindow, setCountWindow] = useState("");
  const [step, setStep] = useState<LookupStep>("init");
  const [result, setResult] = useState<TokenSerialLookupResponse | null>(null);
  const [searchedOtp, setSearchedOtp] = useState("");

  const buildParams = (countOnly: boolean): Record<string, number | string> => {
    const params: Record<string, number | string> = {};

    if (tokenType) {
      params.type = tokenType;
    }

    if (assignment === "assigned") {
      params.assigned = 1;
    }

    if (assignment === "unassigned") {
      params.unassigned = 1;
    }

    if (serialSubstring.trim()) {
      params.serial = serialSubstring.trim();
    }

    if (countWindow.trim()) {
      params.window = Number(countWindow);
    }

    if (countOnly) {
      params.count = "1";
    }

    return params;
  };

  const countMutation = useMutation({
    mutationFn: () => getSerialByOtp(apiClient, otp.trim(), buildParams(true)),
    onSuccess: (data) => {
      setResult(data);
      setSearchedOtp(otp.trim());
      setStep("count");
    }
  });
  const searchMutation = useMutation({
    mutationFn: () => getSerialByOtp(apiClient, otp.trim(), buildParams(false)),
    onSuccess: (data) => {
      setResult(data);
      setStep("found");
    }
  });

  const isBusy = countMutation.isPending || searchMutation.isPending;
  const inputsDisabled = step === "count" || isBusy;

  const backToForm = () => {
    setStep("init");
    setResult(null);
  };

  // Like the legacy `newOtp` flag: editing after a result hides that result.
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);

    if (step === "found") {
      backToForm();
    }
  };

  return (
    <SidebarLayout sidebar={<TokenSidebar activeItem="getserial" />}>
      <PageHeader
        subtitle={
          <Trans>
            By entering an OTP value you can get the serial number of the token. You can
            also enter additional optional parameters, to narrow down the search for the
            token. So you can only search within certain token types or in assigned or
            unassigned tokens.
          </Trans>
        }
        title={<Trans>Get Serial number by OTP value</Trans>}
      />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={countMutation.error} />
      <ErrorAlert error={searchMutation.error} />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          if (otp.trim() && step === "init" && !isBusy) {
            countMutation.mutate();
          }
        }}
      >
        <Card
          footer={
            step === "init" ? (
              <Button
                disabled={otp.trim().length === 0}
                leftSection={<IconSearch size={16} />}
                loading={countMutation.isPending}
                type="submit"
              >
                <Trans>Get Serial Number</Trans>
              </Button>
            ) : undefined
          }
          title={<Trans>Search parameters</Trans>}
        >
          <TextInput
            autoComplete="off"
            disabled={inputsDisabled}
            id="otp"
            label={<Trans>OTP Value</Trans>}
            mb="sm"
            onChange={(event) => {
              edit(setOtp)(event.currentTarget.value);
            }}
            placeholder={t`enter some OTP value`}
            required
            value={otp}
          />
          <NativeSelect
            data={[{ label: t`Any token type`, value: "" }, ...tokenTypeOptions]}
            disabled={inputsDisabled}
            id="tokentype"
            label={<Trans>Token Type</Trans>}
            mb="sm"
            onChange={(event) => {
              edit(setTokenType)(event.currentTarget.value);
            }}
            value={tokenType}
          />
          <NativeSelect
            data={[
              {
                label: t`It does not matter, if the token is assigned or not`,
                value: ""
              },
              { label: t`The token is assigned to a user`, value: "assigned" },
              { label: t`The token is not assigned to a user`, value: "unassigned" }
            ]}
            disabled={inputsDisabled}
            id="assigned"
            label={<Trans>Assignment State</Trans>}
            mb="sm"
            onChange={(event) => {
              edit((value) => {
                setAssignment(value as AssignmentFilter);
              })(event.currentTarget.value);
            }}
            value={assignment}
          />
          <TextInput
            disabled={inputsDisabled}
            id="serial"
            label={<Trans>Serial Substring</Trans>}
            mb="sm"
            onChange={(event) => {
              edit(setSerialSubstring)(event.currentTarget.value);
            }}
            placeholder={t`an optional serial substring`}
            value={serialSubstring}
          />
          <TextInput
            disabled={inputsDisabled}
            id="window"
            inputMode="numeric"
            label={<Trans>Count Window</Trans>}
            min={1}
            onChange={(event) => {
              edit(setCountWindow)(event.currentTarget.value);
            }}
            placeholder={t`The number of lookahead OTP values. Default 10.`}
            type="number"
            value={countWindow}
          />
        </Card>
      </form>

      {step === "count" ? (
        <Alert
          color="yellow"
          icon={<IconAlertTriangle size={18} />}
          mb="md"
          role="status"
          variant="light"
        >
          <Trans>
            Your search would include {result?.count ?? 0} tokens. This can take a lot
            of time and could even timeout. Do you want to run the search? You might
            also cancel this and narrow down the search!
          </Trans>
          <Group gap="xs" mt="sm">
            <Button
              loading={searchMutation.isPending}
              onClick={() => {
                searchMutation.mutate();
              }}
              size="xs"
            >
              <Trans>Run search</Trans>
            </Button>
            <Button
              disabled={searchMutation.isPending}
              onClick={backToForm}
              size="xs"
              variant="default"
            >
              <Trans>Cancel</Trans>
            </Button>
          </Group>
        </Alert>
      ) : null}

      {step === "found" && result?.serial ? (
        <Alert
          color="green"
          icon={<IconCircleCheck size={18} />}
          mb="md"
          role="status"
          variant="light"
        >
          <Trans>
            The Serial number for the OTP value {searchedOtp} is{" "}
            <Anchor
              href={hashHref(`/token/details/${encodeURIComponent(result.serial)}`)}
              size="sm"
            >
              {result.serial}
            </Anchor>
            .
          </Trans>
          <Group mt="sm">
            <Button onClick={backToForm} size="xs" variant="default">
              <Trans>OK</Trans>
            </Button>
          </Group>
        </Alert>
      ) : null}

      {step === "found" && !result?.serial ? (
        <Alert
          color="yellow"
          icon={<IconAlertTriangle size={18} />}
          mb="md"
          role="status"
          variant="light"
        >
          <Trans>No Serial number could be found for OTP value {searchedOtp}.</Trans>
          <Group mt="sm">
            <Button onClick={backToForm} size="xs" variant="default">
              <Trans>OK</Trans>
            </Button>
          </Group>
        </Alert>
      ) : null}
    </SidebarLayout>
  );
}
