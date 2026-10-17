import { Trans } from "@lingui/react/macro";
import { Box, Divider, NavLink, Stack, Text } from "@mantine/core";
import {
  IconInfoCircle,
  IconSettings,
  IconUser,
  IconUserPlus,
  IconUsers
} from "@tabler/icons-react";
import type { ReactNode } from "react";

import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { SidebarSection } from "@/components/layout/SidebarSection";
import { hashHref } from "@/lib/hashbang";

export type UserSidebarItem = "add" | "details" | "list" | "password";

export interface UserSidebarProps {
  activeItem: UserSidebarItem;
  detailsUsername?: string | undefined;
  /** Realm selector rendered under "All users", like the legacy sidebar. */
  realmSelector?: ReactNode;
  userCount?: number | undefined;
}

/**
 * Port of the navigation in `user.html`. The documentation links point at
 * the latest docs because the running version number is only known to the
 * Angular login controller.
 */
const docsBaseUrl = "https://edumfa.readthedocs.io/en/latest/webui/";

export function UserSidebar({
  activeItem,
  detailsUsername,
  realmSelector,
  userCount
}: UserSidebarProps) {
  const { rights, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  return (
    <Stack gap={2}>
      {isUser && hasRight(rights, "userlist") ? (
        <NavLink
          active={activeItem === "password"}
          component="a"
          href={hashHref("/user/password")}
          label={<Trans>Your details</Trans>}
          leftSection={<IconUser size={16} />}
        />
      ) : null}

      {isAdmin ? (
        <>
          <NavLink
            active={activeItem === "list"}
            component="a"
            href={hashHref("/user/list")}
            label={<Trans>All users</Trans>}
            leftSection={<IconUsers size={16} />}
          />
          {realmSelector ? (
            <Box px="sm" py="xs">
              {realmSelector}
            </Box>
          ) : null}
          {activeItem === "details" ? (
            <NavLink
              active
              label={<Trans>User {detailsUsername}</Trans>}
              leftSection={<IconUser size={16} />}
            />
          ) : null}
          {hasRight(rights, "adduser") ? (
            <NavLink
              active={activeItem === "add"}
              component="a"
              href={hashHref("/user/add")}
              label={<Trans>Add user</Trans>}
              leftSection={<IconUserPlus size={16} />}
            />
          ) : null}
          <SidebarSection>
            <Trans>Quick links</Trans>
          </SidebarSection>
          {hasRight(rights, "resolverwrite") ? (
            <NavLink
              component="a"
              href={hashHref("/config/realms/list")}
              label={<Trans>Edit realms</Trans>}
              leftSection={<IconSettings size={16} />}
            />
          ) : null}
          {userCount !== undefined ? (
            <Text c="dimmed" px="sm" py="xs" size="sm">
              <Trans>total users:</Trans> {userCount}
            </Text>
          ) : null}
          <Divider my="xs" />
          <HelpLink activeItem={activeItem} />
        </>
      ) : null}
    </Stack>
  );
}

function HelpLink({ activeItem }: { activeItem: UserSidebarItem }) {
  const target =
    activeItem === "add"
      ? {
          href: `${docsBaseUrl}manage_users.html`,
          label: <Trans>Help about manage Users</Trans>
        }
      : activeItem === "details"
        ? {
            href: `${docsBaseUrl}user_details.html`,
            label: <Trans>Help about User Details</Trans>
          }
        : {
            href: `${docsBaseUrl}index.html#users`,
            label: <Trans>Help about Users</Trans>
          };

  return (
    <NavLink
      component="a"
      href={target.href}
      label={target.label}
      leftSection={<IconInfoCircle size={16} />}
      target="_external"
    />
  );
}
