import { Trans } from "@lingui/react/macro";
import { Divider, NavLink, Stack } from "@mantine/core";
import { IconEye, IconQuestionMark } from "@tabler/icons-react";

import { TokenSidebarHelpLink } from "./sidebar/TokenSidebarHelpLink";
import { TokenSidebarMainLinks } from "./sidebar/TokenSidebarMainLinks";
import { useTokenSidebarAccess } from "./sidebar/useTokenSidebarAccess";
import { hasRight } from "@/auth/permissions";
import { hashHref } from "@/lib/hashbang";

export type TokenSidebarItem =
  | "applications"
  | "assign"
  | "challenges"
  | "details"
  | "enroll"
  | "getserial"
  | "import"
  | "list"
  | "lost"
  | "wizard";

export interface TokenSidebarProps {
  activeItem: TokenSidebarItem;
  /** Serial shown by the "Token ..." and "Lost Token" entries on the detail views. */
  serial?: string | undefined;
}

/**
 * Port of the navigation in `token.html`. The help links point at the
 * latest docs because the running version number is only known to the
 * Angular login controller.
 */
export function TokenSidebar({ activeItem, serial }: TokenSidebarProps) {
  const { isAdmin, rights } = useTokenSidebarAccess();
  const isTokenView = activeItem === "details" || activeItem === "lost";

  return (
    <Stack gap={2}>
      <TokenSidebarMainLinks activeItem={activeItem} serial={serial} />
      {isTokenView && serial && hasRight(rights, "losttoken") ? (
        <>
          <Divider my="xs" />
          <NavLink
            active={activeItem === "lost"}
            component="a"
            href={hashHref(`/token/lost/${encodeURIComponent(serial)}`)}
            label={<Trans>Lost Token</Trans>}
            leftSection={<IconEye size={16} />}
          />
        </>
      ) : null}
      {isAdmin && hasRight(rights, "getserial") ? (
        <>
          <Divider my="xs" />
          <NavLink
            active={activeItem === "getserial"}
            component="a"
            href={hashHref("/token/getserial")}
            label={<Trans>Get Serial</Trans>}
            leftSection={<IconQuestionMark size={16} />}
          />
        </>
      ) : null}
      <TokenSidebarHelpLink activeItem={activeItem} />
    </Stack>
  );
}
