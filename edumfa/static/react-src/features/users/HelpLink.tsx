import { Trans } from "@lingui/react/macro";
import { NavLink } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

import type { UserSidebarItem } from "./UserSidebar";

/**
 * The documentation links point at the latest docs because the running
 * version number is only known to the Angular login controller.
 */
const docsBaseUrl = "https://edumfa.readthedocs.io/en/latest/webui/";

export function HelpLink({ activeItem }: { activeItem: UserSidebarItem }) {
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
