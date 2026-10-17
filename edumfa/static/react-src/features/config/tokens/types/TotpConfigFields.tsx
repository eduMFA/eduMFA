import { Trans } from "@lingui/react/macro";
import { Anchor, Checkbox, NativeSelect, Stack, Text, TextInput } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import {
  getFlag,
  getText,
  hashlibs,
  totpTimeSteps
} from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.totp.html`. */
export function TotpConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  return (
    <>
      <HelpText>
        <Trans>
          The TOTP Token is a time based one time password token. It is described in{" "}
          <Anchor
            href="https://tools.ietf.org/html/rfc6238"
            inherit
            rel="noopener"
            target="_blank"
          >
            RFC 6238
          </Anchor>
          .
        </Trans>
      </HelpText>
      <Text mb="md" size="sm">
        <Trans>
          Here you can define settings, that will be set as default values, when
          enrolling a TOTP token.
        </Trans>
      </Text>
      <Stack gap="sm">
        <NativeSelect
          data={totpTimeSteps}
          id="totpStep"
          label={<Trans>Default Time Step</Trans>}
          onChange={(event) => {
            onChange({ "totp.timeStep": event.currentTarget.value });
          }}
          value={getText(form, "totp.timeStep")}
        />
        <TextInput
          id="totpWindow"
          inputMode="numeric"
          label={<Trans>Default Time Window</Trans>}
          onChange={(event) => {
            onChange({ "totp.timeWindow": event.currentTarget.value });
          }}
          placeholder="180"
          required
          value={getText(form, "totp.timeWindow")}
        />
        <TextInput
          id="totpShift"
          inputMode="numeric"
          label={<Trans>Default Time Shift</Trans>}
          onChange={(event) => {
            onChange({ "totp.timeShift": event.currentTarget.value });
          }}
          placeholder="0"
          required
          value={getText(form, "totp.timeShift")}
        />
        <Checkbox
          checked={getFlag(form, "totp.useTimeShift")}
          id="totpUseTimeShift"
          label={<Trans>Use Time Shift</Trans>}
          onChange={(event) => {
            onChange({ "totp.useTimeShift": event.currentTarget.checked });
          }}
        />
        <NativeSelect
          data={hashlibs}
          id="totpHashlib"
          label={<Trans>Default Hashlib</Trans>}
          onChange={(event) => {
            onChange({ "totp.hashlib": event.currentTarget.value });
          }}
          value={getText(form, "totp.hashlib")}
        />
      </Stack>
    </>
  );
}
