import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";

import { HelpText } from "./HelpText";

/** The introduction of the Yubikey settings with links to both validation APIs. */
export function YubikeyHelpText() {
  const { t } = useLingui();

  return (
    <>
      <HelpText>
        {t`This is a Yubikey in the Yubico Mode authenticated against eduMFA. The Yubikey emits a 44 character on time password.`}
      </HelpText>
      <HelpText>
        <Trans>
          The authentication request can be handled by the default eduMFA{" "}
          <Anchor
            href="https://edumfa.readthedocs.io/en/latest/modules/api/validate.html"
            inherit
            rel="noopener"
            target="_blank"
          >
            validate API
          </Anchor>{" "}
          but can also be handled by the{" "}
          <Anchor
            href="https://edumfa.readthedocs.io/en/latest/modules/lib/tokentypes/yubikey.html#edumfa.lib.tokens.yubikeytoken.YubikeyTokenClass.api_endpoint"
            inherit
            rel="noopener"
            target="_blank"
          >
            Yubico Validation Protocol
          </Anchor>
          .
        </Trans>
      </HelpText>
    </>
  );
}
