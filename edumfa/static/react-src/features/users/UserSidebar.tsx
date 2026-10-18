import { Trans, useLingui } from "@lingui/react/macro";
import { Box, Divider, NavLink, Stack, Text } from "@mantine/core";
import { IconSettings, IconUser, IconUserPlus, IconUsers } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { HelpLink } from "./HelpLink";
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

/** Port of the navigation in `user.html`. */
export function UserSidebar({
  activeItem,
  detailsUsername,
  realmSelector,
  userCount
}: UserSidebarProps) {
  const { t } = useLingui();

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
          label={t`Your details`}
          leftSection={<IconUser size={16} />}
        />
      ) : null}

      {isAdmin ? (
        <>
          <NavLink
            active={activeItem === "list"}
            component="a"
            href={hashHref("/user/list")}
            label={t`All users`}
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
              label={t`Add user`}
              leftSection={<IconUserPlus size={16} />}
            />
          ) : null}
          <SidebarSection>{t`Quick links`}</SidebarSection>
          {hasRight(rights, "resolverwrite") ? (
            <NavLink
              component="a"
              href={hashHref("/config/realms/list")}
              label={t`Edit realms`}
              leftSection={<IconSettings size={16} />}
            />
          ) : null}
          {userCount !== undefined ? (
            <Text c="dimmed" px="sm" py="xs" size="sm">
              {t`total users:`} {userCount}
            </Text>
          ) : null}
          <Divider my="xs" />
          <HelpLink activeItem={activeItem} />
        </>
      ) : null}
    </Stack>
  );
}
