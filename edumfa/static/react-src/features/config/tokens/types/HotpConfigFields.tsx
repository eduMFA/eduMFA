import { Trans } from "@lingui/react/macro";
import { Anchor, NativeSelect, Text } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { getText, hashlibs } from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.hotp.html`. */
export function HotpConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  return (
    <>
      <HelpText>
        <Trans>
          The HOTP Token is a event based one time password token. It is described in{" "}
          <Anchor
            href="https://tools.ietf.org/html/rfc4226"
            inherit
            rel="noopener"
            target="_blank"
          >
            RFC 4226
          </Anchor>
          .
        </Trans>
      </HelpText>
      <Text mb="md" size="sm">
        <Trans>
          Here you can define settings, that will be set as default values, when
          enrolling a HOTP token.
        </Trans>
      </Text>
      <NativeSelect
        data={hashlibs}
        id="hotpHashlib"
        label={<Trans>Default Hashlib</Trans>}
        onChange={(event) => {
          onChange({ "hotp.hashlib": event.currentTarget.value });
        }}
        value={getText(form, "hotp.hashlib")}
      />
    </>
  );
}
