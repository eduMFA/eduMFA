import { useLingui } from "@lingui/react/macro";
import { Checkbox, Stack, TextInput } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { getFlag, getText } from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.remote.html`. */
export function RemoteConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <HelpText>
        {t`The Remote token forwards the authentication request to another eduMFA server.`}
      </HelpText>
      <Stack gap="sm">
        <Checkbox
          checked={getFlag(form, "remote.verify_ssl_certificate")}
          id="remoteSSL"
          label={t`Verify SSL certificate`}
          onChange={(event) => {
            onChange({ "remote.verify_ssl_certificate": event.currentTarget.checked });
          }}
        />
        <TextInput
          id="remoteServer"
          label={t`Default Remote Server`}
          onChange={(event) => {
            onChange({ "remote.server": event.currentTarget.value });
          }}
          placeholder="https://your.other.edumfa.server"
          required
          value={getText(form, "remote.server")}
        />
      </Stack>
    </>
  );
}
