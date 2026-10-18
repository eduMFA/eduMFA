import { Trans, useLingui } from "@lingui/react/macro";
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
  const { t } = useLingui();

  const { canEnroll, canManageApplications, isAdmin, isUser, rights, settings } =
    useTokenSidebarAccess();

  return (
    <>
      <NavLink
        active={activeItem === "list"}
        component="a"
        href={hashHref("/token/list")}
        label={t`All tokens`}
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
          label={t`Enroll Token`}
          leftSection={<IconEdit size={16} />}
        />
      ) : null}
      {isUser && canEnroll && settings.tokenWizard2nd ? (
        <NavLink
          active={activeItem === "wizard"}
          component="a"
          href={hashHref("/token/wizard")}
          label={t`Token enrollment wizard`}
          leftSection={<IconStar size={16} />}
        />
      ) : null}
      {isUser && hasRight(rights, "assign") ? (
        <NavLink
          active={activeItem === "assign"}
          component="a"
          href={hashHref("/token/assign")}
          label={t`Assign Token`}
          leftSection={<IconPlus size={16} />}
        />
      ) : null}
      {isAdmin && hasRight(rights, "importtokens") ? (
        <NavLink
          active={activeItem === "import"}
          component="a"
          href={hashHref("/token/import")}
          label={t`Import Tokens`}
          leftSection={<IconUpload size={16} />}
        />
      ) : null}
      {isAdmin && hasRight(rights, "getchallenges") ? (
        <NavLink
          active={activeItem === "challenges"}
          component="a"
          href={hashHref("/token/challenges")}
          label={t`List Challenges`}
          leftSection={<IconRefresh size={16} />}
        />
      ) : null}
      {canManageApplications ? (
        <NavLink
          active={activeItem === "applications"}
          component="a"
          href={hashHref("/token/applications/ssh")}
          label={t`Token Applications`}
          leftSection={<IconDeviceDesktop size={16} />}
        />
      ) : null}
    </>
  );
}
