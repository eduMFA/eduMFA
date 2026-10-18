import { Trans } from "@lingui/react/macro";
import {
  IconCalendar,
  IconDeviceMobile,
  IconLayoutDashboard,
  IconSearch,
  IconServer,
  IconSettings,
  IconUser
} from "@tabler/icons-react";
import type { ReactNode } from "react";

import { hasMainMenu } from "@/auth/permissions";
import type { WebUiSettings } from "@/auth/session";

export interface MainMenuItem {
  activePrefixes: string[];
  href: string;
  icon: typeof IconDeviceMobile;
  label: ReactNode;
  visible: boolean;
}

export interface MainMenuContext {
  loggedIn: boolean;
  menus: readonly string[];
  /** The role of the session user; undefined while logged out. */
  role: string | undefined;
  settings: WebUiSettings;
}

/**
 * The main menu of `templates/menu.html`: every entry with its visibility
 * per role and menu policy, in the order of the legacy template.
 */
export function buildMainMenuItems({
  loggedIn,
  menus,
  role,
  settings
}: MainMenuContext): MainMenuItem[] {
  const isAdmin = role === "admin";
  const isUser = role === "user";

  return [
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
}
