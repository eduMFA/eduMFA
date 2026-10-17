import { Trans } from "@lingui/react/macro";
import { Divider, NavLink, Stack } from "@mantine/core";
import {
  IconDeviceDesktop,
  IconEdit,
  IconEye,
  IconInfoCircle,
  IconKey,
  IconList,
  IconPlus,
  IconQuestionMark,
  IconRefresh,
  IconStar,
  IconUpload
} from "@tabler/icons-react";

import { useAuth } from "@/auth/AuthProvider";
import { hasEnrollRight, hasRight } from "@/auth/permissions";
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
  const { rights, settings, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const canEnroll = hasEnrollRight(rights);
  const canManageApplications =
    isAdmin &&
    hasRight(rights, "tokenlist") &&
    hasRight(rights, "machinelist") &&
    hasRight(rights, "manage_machine_tokens");
  const isTokenView = activeItem === "details" || activeItem === "lost";

  return (
    <Stack gap={2}>
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
      {activeItem === "list" ? (
        <>
          <Divider my="xs" />
          <NavLink
            component="a"
            href="https://edumfa.readthedocs.io/en/latest/webui/index.html#tokens"
            label={<Trans>Help about Token</Trans>}
            leftSection={<IconInfoCircle size={16} />}
            target="_external"
          />
        </>
      ) : null}
      {activeItem === "import" ? (
        <>
          <Divider my="xs" />
          <NavLink
            component="a"
            href="https://edumfa.readthedocs.io/en/latest/workflows_and_tools/import/index.html"
            label={<Trans>Help about Token Import</Trans>}
            leftSection={<IconInfoCircle size={16} />}
            target="_external"
          />
        </>
      ) : null}
      {activeItem === "details" ? (
        <>
          <Divider my="xs" />
          <NavLink
            component="a"
            href="https://edumfa.readthedocs.io/en/latest/webui/token_details.html"
            label={<Trans>Help about Token Details</Trans>}
            leftSection={<IconInfoCircle size={16} />}
            target="_external"
          />
        </>
      ) : null}
    </Stack>
  );
}
