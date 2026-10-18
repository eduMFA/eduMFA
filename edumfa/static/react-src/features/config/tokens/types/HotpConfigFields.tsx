import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, NativeSelect, Text } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { getText, hashlibs } from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.hotp.html`. */
export function HotpConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const { t } = useLingui();

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
        {t`Here you can define settings, that will be set as default values, when enrolling a HOTP token.`}
      </Text>
      <NativeSelect
        data={hashlibs}
        id="hotpHashlib"
        label={t`Default Hashlib`}
        onChange={(event) => {
          onChange({ "hotp.hashlib": event.currentTarget.value });
        }}
        value={getText(form, "hotp.hashlib")}
      />
    </>
  );
}
