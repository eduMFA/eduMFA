import { useLingui } from "@lingui/react/macro";
import { Alert, Stack, TextInput } from "@mantine/core";

import { HelpText } from "./HelpText";
import type { TokenConfigFieldsProps } from "./types";
import { getText } from "@/features/config/tokens/tokenConfigForm";

/** Port of `config.token.u2f.html`. */
export function U2fConfigFields({ form, onChange }: TokenConfigFieldsProps) {
  const { t } = useLingui();

  const appId = getText(form, "u2f.appId");

  return (
    <>
      <HelpText>
        {t`The U2F token is a hardware token, that communicates with the browser. You need to set the correct appId, which in fact is the URL of your eduMFA installation.`}
      </HelpText>
      <Stack gap="sm">
        <TextInput
          description={
            <>
              {t`The URL of your eduMFA installation.`}{" "}
              {t`This must be a valid FQDN with also a valid top level domain - otherwise you might receive a U2F Error 2 (Bad Request).`}
            </>
          }
          id="u2fAppId"
          label={t`appId`}
          onChange={(event) => {
            onChange({ "u2f.appId": event.currentTarget.value });
          }}
          placeholder="https://edumfa.server.com"
          required
          type="url"
          value={appId}
        />
        {appId !== "" && !appId.startsWith("https:") ? (
          <Alert color="yellow" variant="light">
            {t`The AppID needs to start with "https".`}
          </Alert>
        ) : null}
        {appId.endsWith("/") ? (
          <Alert color="yellow" variant="light">
            {t`The AppID must not end with a "/".`}
          </Alert>
        ) : null}
      </Stack>
    </>
  );
}
