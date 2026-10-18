import { NavLink } from "@mantine/core";
import { useLocation } from "react-router-dom";

import { buildMainMenuItems } from "./mainMenuItems";
import { useAuth } from "@/auth/AuthProvider";
import { hashHref } from "@/lib/hashbang";

export interface MainMenuProps {
  loggedIn: boolean;
}

/** The main menu links next to the brand; the entry of the current route prefix is active. */
export function MainMenu({ loggedIn }: MainMenuProps) {
  const { pathname } = useLocation();
  const { menus, settings, user } = useAuth();
  const items = buildMainMenuItems({ loggedIn, menus, role: user?.role, settings });

  return items
    .filter((item) => item.visible)
    .map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          active={item.activePrefixes.some((prefix) => pathname.startsWith(prefix))}
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
    });
}
