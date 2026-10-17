import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Stack, TextInput } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { getText } from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.yubico.html`. */
export function YubicoConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <HelpText>
        <Trans>
          The Yubico Token is a Yubikey that is registered with the YubiCloud service.
          The Yubikey emits a 44 character one time password. The first 12 characters
          are a unique ID which is used to bind the device to the user.
        </Trans>
      </HelpText>
      <HelpText>
        <Trans>
          The authentication request is forwarded to the YubiCloud. For accessing the
          YubiCloud you need to enter an API Client ID and an API Key, which you can
          request{" "}
          <Anchor
            href="https://upgrade.yubico.com/getapikey/"
            inherit
            rel="noopener"
            target="_blank"
          >
            here
          </Anchor>
          .
        </Trans>
      </HelpText>
      <Stack gap="sm">
        <TextInput
          id="yubicoId"
          label={<Trans>API client ID</Trans>}
          onChange={(event) => {
            onChange({ "yubico.id": event.currentTarget.value });
          }}
          placeholder={t`The client ID`}
          required
          value={getText(form, "yubico.id")}
        />
        <TextInput
          id="yubicoKey"
          label={<Trans>API Key</Trans>}
          onChange={(event) => {
            onChange({ "yubico.secret": event.currentTarget.value });
          }}
          placeholder={t`API Key`}
          required
          value={getText(form, "yubico.secret")}
        />
        <TextInput
          id="yubicoURL"
          label={<Trans>Yubico URL</Trans>}
          onChange={(event) => {
            onChange({ "yubico.url": event.currentTarget.value });
          }}
          placeholder="https://api.yubico.com/wsapi/2.0/verify"
          required
          type="url"
          value={getText(form, "yubico.url")}
        />
      </Stack>
    </>
  );
}
