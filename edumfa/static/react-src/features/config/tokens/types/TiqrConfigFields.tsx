import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor, Stack, TextInput } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { getText } from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.tiqr.html`. */
export function TiqrConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const { t } = useLingui();

  return (
    <>
      <HelpText>
        {t`The TiQR Token is an OCRA based Smartphone Token, that can be used to authenticate by just scanning a QR code.`}
      </HelpText>
      <Stack gap="sm">
        <TextInput
          description={t`The Registration Server is this eduMFA server. Note that the eduMFA server needs to be accessible from the users smartphone.`}
          id="tiqrRegServer"
          label={t`TiQR Registration Server`}
          onChange={(event) => {
            onChange({ "tiqr.regServer": event.currentTarget.value });
          }}
          placeholder="http://edumfa.server/ttype/tiqr"
          required
          type="url"
          value={getText(form, "tiqr.regServer")}
        />
        <TextInput
          description={t`The Authentication Server is this eduMFA server. Note that the eduMFA server needs to be accessible from the users smartphone.`}
          id="tiqrAuthServer"
          label={t`TiQR Authentication Server`}
          onChange={(event) => {
            onChange({ "tiqr.authServer": event.currentTarget.value });
          }}
          type="url"
          value={getText(form, "tiqr.authServer")}
        />
        <TextInput
          description={t`This is the display name of your service in the TiQR app.`}
          id="tiqrDisplayname"
          label={t`TiQR Service Displayname`}
          onChange={(event) => {
            onChange({ "tiqr.serviceDisplayname": event.currentTarget.value });
          }}
          value={getText(form, "tiqr.serviceDisplayname")}
        />
        <TextInput
          description={t`This is the service identifier that will be passed to the TiQR app. This should contain a reverse FQDN (defaults to org.edumfa).`}
          id="tiqrServiceIdentifier"
          label={t`TiQR Service Identifier`}
          onChange={(event) => {
            onChange({ "tiqr.serviceIdentifier": event.currentTarget.value });
          }}
          value={getText(form, "tiqr.serviceIdentifier")}
        />
        <TextInput
          description={t`The URL that contains the logo of the service.`}
          id="tiqrLogoUrl"
          label={t`TiQR Logo URL`}
          onChange={(event) => {
            onChange({ "tiqr.logoUrl": event.currentTarget.value });
          }}
          placeholder="https://edumfa.server/static/css/eduMFA-logo.png"
          required
          type="url"
          value={getText(form, "tiqr.logoUrl")}
        />
        <TextInput
          description={t`The website of the identity provider`}
          id="tiqrInfoUrl"
          label={t`TiQR Info URL`}
          onChange={(event) => {
            onChange({ "tiqr.infoUrl": event.currentTarget.value });
          }}
          placeholder="https://www.edumfa.org"
          required
          type="url"
          value={getText(form, "tiqr.infoUrl")}
        />
        <TextInput
          description={
            <Trans>
              This is the OCRA suite used by the TiQR App. The default OCRA suite is
              OCRA-1:HOTP-SHA1-6:QN10. For more details see the{" "}
              <Anchor
                href="http://tools.ietf.org/html/rfc6287#page-8"
                inherit
                rel="noopener"
                target="_blank"
              >
                RFC 6287
              </Anchor>
              .
            </Trans>
          }
          id="tiqrOCRA"
          label={t`OCRA Suite`}
          onChange={(event) => {
            onChange({ "tiqr.ocrasuite": event.currentTarget.value });
          }}
          value={getText(form, "tiqr.ocrasuite")}
        />
      </Stack>
    </>
  );
}
