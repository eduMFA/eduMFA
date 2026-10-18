import { useLingui } from "@lingui/react/macro";
import { Divider, NavLink, Stack } from "@mantine/core";

import { tokenConfigTypeKeys, type TokenConfigTypeKey } from "./tokenConfigForm";
import { tokenTypes } from "./tokenTypes";
import { useDocsUrl } from "@/lib/docs";
import { hashHref } from "@/lib/hashbang";

/** One link per token type plus the help link. */
export function TokenConfigSidebar({ tokenType }: { tokenType: TokenConfigTypeKey }) {
  const { t } = useLingui();

  const helpUrl = useDocsUrl("configuration/token_config.html");

  return (
    <Stack gap={2}>
      {tokenConfigTypeKeys.map((key) => (
        <NavLink
          active={key === tokenType}
          component="a"
          href={hashHref(`/config/tokens/${key}`)}
          key={key}
          label={key === "question" ? t`Questionnaire` : tokenTypes[key].label}
        />
      ))}
      <Divider my="xs" />
      <NavLink
        component="a"
        href={helpUrl}
        label={t`Help about Token Settings`}
        rel="noopener"
        target="_blank"
      />
    </Stack>
  );
}
