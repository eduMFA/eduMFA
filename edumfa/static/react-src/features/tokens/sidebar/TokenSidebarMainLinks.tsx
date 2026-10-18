import { Trans } from "@lingui/react/macro";
import { NavLink } from "@mantine/core";
import {
  IconDeviceDesktop,
  IconEdit,
  IconKey,
  IconList,
  IconPlus,
  IconRefresh,
  IconStar,
  IconUpload
} from "@tabler/icons-react";

import { useTokenSidebarAccess } from "./useTokenSidebarAccess";
import { hasRight } from "@/auth/permissions";
import type { TokenSidebarItem } from "@/features/tokens/TokenSidebar";
import { hashHref } from "@/lib/hashbang";

export interface TokenSidebarMainLinksProps {
  activeItem: TokenSidebarItem;
  /** Serial shown by the "Token ..." entry on the detail views. */
  serial: string | undefined;
}

/** The token views of the session's role, in the order of `token.html`. */
export function TokenSidebarMainLinks({
  activeItem,
  serial
}: TokenSidebarMainLinksProps) {
  const { canEnroll, canManageApplications, isAdmin, isUser, rights, settings } =
    useTokenSidebarAccess();

  return (
    <>
      <NavLink
        active={activeItem === "list"}
        component="a"
        href={hashHref("/token/list")}
        label={<Trans>All tokens</Trans>}
        leftSection={<IconList size={16} />}
      />
      {activeItem === "details" ? (
        <NavLink
          active
          label={<Trans>Token {serial}</Trans>}
          leftSection={<IconKey size={16} />}
        />
      ) : null}
      {canEnroll || isAdmin ? (
        // ui-router addresses the parameterless `token.enroll` state this way.
        <NavLink
          active={activeItem === "enroll"}
          component="a"
          href={hashHref("/token/enroll//")}
          label={<Trans>Enroll Token</Trans>}
          leftSection={<IconEdit size={16} />}
        />
      ) : null}
      {isUser && canEnroll && settings.tokenWizard2nd ? (
        <NavLink
          active={activeItem === "wizard"}
          component="a"
          href={hashHref("/token/wizard")}
          label={<Trans>Token enrollment wizard</Trans>}
          leftSection={<IconStar size={16} />}
        />
      ) : null}
      {isUser && hasRight(rights, "assign") ? (
        <NavLink
          active={activeItem === "assign"}
          component="a"
          href={hashHref("/token/assign")}
          label={<Trans>Assign Token</Trans>}
          leftSection={<IconPlus size={16} />}
        />
      ) : null}
      {isAdmin && hasRight(rights, "importtokens") ? (
        <NavLink
          active={activeItem === "import"}
          component="a"
          href={hashHref("/token/import")}
          label={<Trans>Import Tokens</Trans>}
          leftSection={<IconUpload size={16} />}
        />
      ) : null}
      {isAdmin && hasRight(rights, "getchallenges") ? (
        <NavLink
          active={activeItem === "challenges"}
          component="a"
          href={hashHref("/token/challenges")}
          label={<Trans>List Challenges</Trans>}
          leftSection={<IconRefresh size={16} />}
        />
      ) : null}
      {canManageApplications ? (
        <NavLink
          active={activeItem === "applications"}
          component="a"
          href={hashHref("/token/applications/ssh")}
          label={<Trans>Token Applications</Trans>}
          leftSection={<IconDeviceDesktop size={16} />}
        />
      ) : null}
    </>
  );
}
