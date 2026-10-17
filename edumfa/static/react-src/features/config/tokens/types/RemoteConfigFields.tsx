import { Trans } from "@lingui/react/macro";
import { Checkbox, Stack, TextInput } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { getFlag, getText } from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.remote.html`. */
export function RemoteConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  return (
    <>
      <HelpText>
        <Trans>
          The Remote token forwards the authentication request to another eduMFA server.
        </Trans>
      </HelpText>
      <Stack gap="sm">
        <Checkbox
          checked={getFlag(form, "remote.verify_ssl_certificate")}
          id="remoteSSL"
          label={<Trans>Verify SSL certificate</Trans>}
          onChange={(event) => {
            onChange({ "remote.verify_ssl_certificate": event.currentTarget.checked });
          }}
        />
        <TextInput
          id="remoteServer"
          label={<Trans>Default Remote Server</Trans>}
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
