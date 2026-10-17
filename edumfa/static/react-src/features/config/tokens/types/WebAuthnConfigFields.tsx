import { Trans } from "@lingui/react/macro";
import { Alert, Stack, TextInput } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { getText } from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.webauthn.html`. */
export function WebAuthnConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const trustAnchorDir = getText(form, "webauthn.trust_anchor_dir");

  return (
    <>
      <HelpText>
        <Trans>
          The WebAuthn token is a hardware token, that communicates with the browser.
          You may set a trust anchor directory, which is a path to a directory
          containing certificates to trust for WebAuthn authenticator attestation.
        </Trans>
      </HelpText>
      <Stack gap="sm">
        <TextInput
          description={
            <>
              <Trans>The path to the directory containing the trust anchors.</Trans>{" "}
              <Trans>
                This should be a path to a local directory on the server, that eduMFA
                has read access to. It should contain certificate files. Any
                certificates in this directory will be trusted to correctly attest
                authenticators during enrollment.
              </Trans>{" "}
              <Trans>
                This does not need to be set for WebAuthn to work, however without this,
                eduMFA can not check, whether an attestation certificate is actually
                trusted (it will still be checked for validity). Therefore it is
                mandatory to set this, if webauthn_authenticator_attestation_level is
                set to "trusted" by a policy for any user.
              </Trans>
            </>
          }
          id="webAuthnTrustAnchorDir"
          label={<Trans>trust_anchor_dir</Trans>}
          onChange={(event) => {
            onChange({ "webauthn.trust_anchor_dir": event.currentTarget.value });
          }}
          placeholder="/etc/edumfa/trusted_attestation_roots"
          value={trustAnchorDir}
        />
        {trustAnchorDir !== "" && !trustAnchorDir.startsWith("/") ? (
          <Alert color="yellow" variant="light">
            <Trans>The trust_anchor_dir must be an absolute path.</Trans>
          </Alert>
        ) : null}
        {trustAnchorDir.endsWith("/") ? (
          <Alert color="yellow" variant="light">
            <Trans>The trust_anchor_dir must not end with a "/".</Trans>
          </Alert>
        ) : null}
      </Stack>
    </>
  );
}
