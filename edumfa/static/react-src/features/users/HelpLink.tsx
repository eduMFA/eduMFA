import { useLingui } from "@lingui/react/macro";
import { NavLink } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import type { UserSidebarItem } from "./UserSidebar";

/**
 * The documentation links point at the latest docs because the running
 * version number is only known to the Angular login controller.
 */
const docsBaseUrl = "https://edumfa.readthedocs.io/en/latest/webui/";

export function HelpLink({ activeItem }: { activeItem: UserSidebarItem }) {
  const { t } = useLingui();

  const helpTarget = (): { href: string; label: string } => {
    switch (activeItem) {
      case "add":
        return {
          href: `${docsBaseUrl}manage_users.html`,
          label: t`Help about manage Users`
        };
      case "details":
        return {
          href: `${docsBaseUrl}user_details.html`,
          label: t`Help about User Details`
        };
      default:
        return {
          href: `${docsBaseUrl}index.html#users`,
          label: t`Help about Users`
        };
    }
  };
  const target = helpTarget();

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
