import { Trans, useLingui } from "@lingui/react/macro";
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Container,
  Group,
  Menu,
  NavLink,
  Text,
  Tooltip
} from "@mantine/core";
import {
  IconCalendar,
  IconChevronDown,
  IconDeviceMobile,
  IconLayoutDashboard,
  IconLock,
  IconLogout,
  IconRefresh,
  IconSearch,
  IconServer,
  IconSettings,
  IconSwitchHorizontal,
  IconUser
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { useApiClient } from "@/api/ApiClientProvider";
import { getRegisterStatus } from "@/api/register";
import { useAuth } from "@/auth/AuthProvider";
import { hasMainMenu } from "@/auth/permissions";
import { clearSession } from "@/auth/sessionStore";
import { hashHref } from "@/lib/hashbang";
import { getUiConfig } from "@/lib/uiConfig";

interface MainMenuItem {
  activePrefixes: string[];
  href: string;
  icon: typeof IconDeviceMobile;
  label: ReactNode;
  visible: boolean;
}

/**
 * Port of `templates/menu.html`: the brand, the main menu per role and
 * menu policy, the node name, the refresh button and the session menu with
 * lock screen and logout. The main menu is hidden in the token wizard.
 */
export function AppNavbar() {
  const { t } = useLingui();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const { isAuthenticated, isLocked, lock, logout, menus, settings, user } = useAuth();
  const uiConfig = getUiConfig();
  const registrationQuery = useQuery({
    queryFn: ({ signal }) => getRegisterStatus(apiClient, signal),
    queryKey: ["register", "status"],
    staleTime: Infinity
  });
  const loggedIn = Boolean(user) && (isAuthenticated || isLocked);
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const logoUrl = uiConfig.logo
    ? `${uiConfig.instanceUrl}/static/css/${uiConfig.logo}`
    : null;
  const nodeName = settings.showNode || uiConfig.showNode;

  const mainMenu: MainMenuItem[] = [
    {
      activePrefixes: ["/dashboard"],
      href: "/dashboard",
      icon: IconLayoutDashboard,
      label: <Trans>Dashboard</Trans>,
      visible: isAdmin && settings.adminDashboard
    },
    {
      activePrefixes: ["/token"],
      href: "/token/list",
      icon: IconDeviceMobile,
      label: <Trans>Tokens</Trans>,
      visible: loggedIn && hasMainMenu(menus, "tokens")
    },
    {
      activePrefixes: ["/user"],
      href: "/user/list",
      icon: IconUser,
      label: <Trans>Users</Trans>,
      visible: isAdmin && hasMainMenu(menus, "users")
    },
    {
      activePrefixes: ["/user"],
      href: "/user/password",
      icon: IconUser,
      label: <Trans>User</Trans>,
      visible: isUser && hasMainMenu(menus, "users")
    },
    {
      activePrefixes: ["/machine"],
      href: "/machine/list",
      icon: IconServer,
      label: <Trans>Machines</Trans>,
      visible: isAdmin && hasMainMenu(menus, "machines")
    },
    {
      activePrefixes: ["/config"],
      href: "/config/system/edit",
      icon: IconSettings,
      label: <Trans>Config</Trans>,
      visible: isAdmin && hasMainMenu(menus, "config")
    },
    {
      activePrefixes: ["/audit"],
      href: "/audit/log",
      icon: IconSearch,
      label: <Trans>Audit</Trans>,
      visible: loggedIn && hasMainMenu(menus, "audit")
    },
    {
      activePrefixes: ["/component"],
      href: "/component/clienttype",
      icon: IconCalendar,
      label: <Trans>Components</Trans>,
      visible: isAdmin && hasMainMenu(menus, "components")
    }
  ];

  return (
    <Box className="app-navbar" component="header">
      <Container className="app-navbar-inner" py={8} size="xl">
        <Group gap="xs" justify="space-between" wrap="wrap">
          <Group gap={4} wrap="wrap">
            <Anchor
              className="app-brand"
              href={hashHref(loggedIn ? "/token/list" : "/login")}
              mr="sm"
              style={{ display: "inline-flex", lineHeight: 0 }}
            >
              {logoUrl ? (
                <img alt="eduMFA" height={40} src={logoUrl} />
              ) : (
                <Text fw={700}>eduMFA</Text>
              )}
            </Anchor>
            {settings.tokenWizard
              ? null
              : mainMenu
                  .filter((item) => item.visible)
                  .map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        active={item.activePrefixes.some((prefix) =>
                          pathname.startsWith(prefix)
                        )}
                        component="a"
                        href={hashHref(item.href)}
                        key={item.href}
                        label={item.label}
                        leftSection={<Icon size={16} />}
                        className="app-navigation-link"
                        style={{
                          borderRadius: "var(--mantine-radius-md)",
                          width: "auto"
                        }}
                      />
                    );
                  })}
          </Group>
          <Group gap="xs" wrap="wrap">
            <Tooltip label={t`Switch to legacy UI`}>
              <ActionIcon
                aria-label={t`Switch to legacy UI`}
                className="ui-switch-button"
                component="a"
                href="?ui=legacy"
                onClick={clearSession}
                size="lg"
                variant="subtle"
              >
                <IconSwitchHorizontal aria-hidden size={18} />
              </ActionIcon>
            </Tooltip>
            {nodeName ? (
              <Text fw={700} size="sm">
                {nodeName}
              </Text>
            ) : null}
            {loggedIn ? (
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={() => {
                  void queryClient.invalidateQueries();
                }}
                size="sm"
                variant="subtle"
              >
                <Trans>Refresh</Trans>
              </Button>
            ) : null}
            {!loggedIn && registrationQuery.data === true ? (
              <NavLink
                active={pathname.startsWith("/register")}
                component="a"
                href={hashHref("/register")}
                label={<Trans>Register</Trans>}
                style={{ borderRadius: "var(--mantine-radius-md)", width: "auto" }}
              />
            ) : null}
            {!loggedIn ? (
              <NavLink
                active={pathname === "/" || pathname.startsWith("/login")}
                component="a"
                href={hashHref("/login")}
                label={<Trans>Login</Trans>}
                style={{ borderRadius: "var(--mantine-radius-md)", width: "auto" }}
              />
            ) : null}
            {loggedIn && user ? (
              <Menu position="bottom-end" shadow="md" width={200}>
                <Menu.Target>
                  <Button
                    color="orange"
                    rightSection={<IconChevronDown size={16} />}
                    size="sm"
                    variant="filled"
                  >
                    {user.username} @{user.realm} ({user.role})
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    disabled={isLocked}
                    leftSection={<IconLock size={16} />}
                    onClick={lock}
                  >
                    <Trans>Lock screen</Trans>
                  </Menu.Item>
                  <Menu.Item leftSection={<IconLogout size={16} />} onClick={logout}>
                    <Trans>Logout</Trans>
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : null}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
