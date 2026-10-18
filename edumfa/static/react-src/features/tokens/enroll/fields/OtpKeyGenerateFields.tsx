import { Trans, useLingui } from "@lingui/react/macro";
import { Checkbox, Stack, Text, TextInput } from "@mantine/core";

import { type TokenTypeFieldsProps } from "./types";
import { hasRight } from "@/auth/permissions";

/** Server-side key generation, two-step enrollment and the typed OTP key. */
export function OtpKeyGenerateFields({
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

  return (
    <>
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
    </>
  );
}
