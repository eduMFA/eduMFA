import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, NativeSelect, Stack, Text, TextInput } from "@mantine/core";

import { SectionTitle } from "./SectionTitle";
import { type TokenTypeFieldsProps } from "./types";
import { hasRight } from "@/auth/permissions";
import {
  hashAlgorithms,
  otpLengths,
  timeShiftOptions,
  timeSteps
} from "@/features/tokens/enroll/enrollForm";

export function OtpKeyFields({
  errors,
  form,
  isWizard,
  onChange,
  rights
}: TokenTypeFieldsProps) {
  const { t } = useLingui();
  const { type } = form;
  const forceServerKey = hasRight(rights, `${type}_force_server_generate`);
  const twoStepForced = hasRight(rights, `${type}_2step=force`);
  const showTwoStep =
    hasRight(rights, `${type}_2step=allow`) || (!isWizard && twoStepForced);
  const timeStepOptions = timeSteps.includes(
    form.timeStep as (typeof timeSteps)[number]
  )
    ? [...timeSteps]
    : [form.timeStep, ...timeSteps];

  return (
    <>
      {!isWizard ? (
        <SectionTitle>
          <Trans>Token data</Trans>
        </SectionTitle>
      ) : null}
      {/* The legacy HOTP template hides the whole key section in the wizard. */}
      {type === "hotp" && isWizard ? null : (
        <Stack gap={4} mb="sm">
          {!forceServerKey ? (
            <Checkbox
              checked={form.genkey}
              id="generate"
              label={
                type === "daypassword" ? (
                  <Trans>Generate secret on the Server</Trans>
                ) : (
                  <Trans>Generate OTP Key on the Server</Trans>
                )
              }
              onChange={(event) => {
                onChange({ genkey: event.currentTarget.checked });
              }}
            />
          ) : null}
          {form.genkey ? (
            <Text c="dimmed" size="sm">
              {type === "daypassword" ? (
                <Trans>
                  The server will create the secret and a QR Code will be displayed for
                  you to be scanned.
                </Trans>
              ) : (
                <Trans>
                  The server will create the OTP key and a QR Code will be displayed to
                  you to be scanned.
                </Trans>
              )}
            </Text>
          ) : null}
        </Stack>
      )}
      {showTwoStep ? (
        <Checkbox
          checked={form.twoStepInit}
          disabled={twoStepForced}
          id="twostep_enrollment"
          label={
            <Trans>
              Use two-step enrollment with the privacyIDEA Authenticator App
            </Trans>
          }
          mb="sm"
          onChange={(event) => {
            onChange({ twoStepInit: event.currentTarget.checked });
          }}
        />
      ) : null}
      {!form.genkey ? (
        <TextInput
          autoComplete="off"
          error={
            errors.includes("otpkey")
              ? t`The OTP key must be a hexadecimal string.`
              : undefined
          }
          id="otpkey"
          label={<Trans>OTP Key</Trans>}
          mb="sm"
          onChange={(event) => {
            onChange({ otpkey: event.currentTarget.value });
          }}
          placeholder={
            type === "daypassword" ? t`Enter the secret...` : t`Enter OTP key...`
          }
          value={form.otpkey}
        />
      ) : null}
      {!hasRight(rights, `${type}_otplen`) ? (
        <NativeSelect
          data={otpLengths.map(String)}
          description={
            form.genkey ? (
              <Trans>Some Authenticator Apps only support an OTP length of 6.</Trans>
            ) : undefined
          }
          id="otplen"
          label={
            type === "daypassword" ? (
              <Trans>password length</Trans>
            ) : (
              <Trans>OTP length</Trans>
            )
          }
          mb="sm"
          onChange={(event) => {
            onChange({ otplen: Number(event.currentTarget.value) });
          }}
          value={String(form.otplen)}
        />
      ) : null}
      {type === "totp" && !hasRight(rights, "totp_timestep") ? (
        <NativeSelect
          data={timeStepOptions}
          description={<Trans>seconds</Trans>}
          id="timestep"
          label={<Trans>Timestep</Trans>}
          mb="sm"
          onChange={(event) => {
            onChange({ timeStep: event.currentTarget.value });
          }}
          value={form.timeStep}
        />
      ) : null}
      {type === "daypassword" && !hasRight(rights, "daypassword_timestep") ? (
        <TextInput
          description={
            form.genkey ? (
              <Trans>
                The time in which the password can be used. For example '1d' or '12h'.
              </Trans>
            ) : undefined
          }
          id="timestep"
          label={<Trans>Timestep</Trans>}
          mb="sm"
          onChange={(event) => {
            onChange({ timeStep: event.currentTarget.value });
          }}
          placeholder="12h or 1d"
          required
          value={form.timeStep}
        />
      ) : null}
      {type === "totp" && !hasRight(rights, "totp_timeshift") ? (
        <NativeSelect
          data={[...timeShiftOptions]}
          description={
            <Trans>Set to 'True' or 'False' to override setting in Token Config.</Trans>
          }
          id="use_timeshift"
          label={<Trans>Use Timeshift</Trans>}
          mb="sm"
          onChange={(event) => {
            onChange({ useTimeShift: event.currentTarget.value });
          }}
          value={form.useTimeShift}
        />
      ) : null}
      {!hasRight(rights, `${type}_hashlib`) ? (
        <NativeSelect
          data={[...hashAlgorithms]}
          description={
            form.genkey ? (
              <Trans>Some Authenticator Apps only support the SHA1 algorithm.</Trans>
            ) : undefined
          }
          id="hashlib"
          label={<Trans>Hash algorithm</Trans>}
          mb="sm"
          onChange={(event) => {
            onChange({ hashlib: event.currentTarget.value });
          }}
          value={form.hashlib}
        />
      ) : null}
    </>
  );
}
