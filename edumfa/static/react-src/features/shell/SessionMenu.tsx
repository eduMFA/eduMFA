import { useLingui } from "@lingui/react/macro";
import { Button, Menu } from "@mantine/core";
import { IconChevronDown, IconLock, IconLogout } from "@tabler/icons-react";

import { useAuth } from "@/auth/AuthProvider";
import type { AuthUser } from "@/auth/session";

export interface SessionMenuProps {
  user: AuthUser;
}

/** The session dropdown of `templates/menu.html`: user, realm and role, lock screen and logout. */
export function SessionMenu({ user }: SessionMenuProps) {
  const { t } = useLingui();

  const { isLocked, lock, logout } = useAuth();

  return (
    <Menu position="bottom-end" shadow="md" width={200}>
      <Menu.Target>
        <Button
          color="orange"
          rightSection={<IconChevronDown size={16} />}
          size="sm"
          variant="filled"
        >
          {user.realm ? `${user.username} @${user.realm}` : user.username} ({user.role})
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          disabled={isLocked}
          leftSection={<IconLock size={16} />}
          onClick={lock}
        >
          {t`Lock screen`}
        </Menu.Item>
        <Menu.Item leftSection={<IconLogout size={16} />} onClick={logout}>
          {t`Logout`}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
