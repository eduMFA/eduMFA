import { Trans } from "@lingui/react/macro";
import { Divider, NavLink, Stack } from "@mantine/core";
import { IconEraser, IconInfoCircle, IconWorld } from "@tabler/icons-react";

import { useDocsUrl } from "@/lib/docs";
import { hashHref } from "@/lib/hashbang";

export interface RealmSidebarProps {
  /** The legacy entry was shown with the `resolverwrite` right. */
  canClearDefault: boolean;
  isClearing: boolean;
  onClearDefault: () => void;
}

/** Port of the sidebar in `config.realms.html`. */
export function RealmSidebar({
  canClearDefault,
  isClearing,
  onClearDefault
}: RealmSidebarProps) {
  const docsUrl = useDocsUrl("configuration/realms.html");

  return (
    <Stack gap={2}>
      <NavLink
        active
        component="a"
        href={hashHref("/config/realms/list")}
        label={<Trans>All Realms</Trans>}
        leftSection={<IconWorld size={16} />}
      />
      {canClearDefault ? (
        <NavLink
          component="button"
          disabled={isClearing}
          label={<Trans>Clear default realm</Trans>}
          leftSection={<IconEraser size={16} />}
          onClick={onClearDefault}
          type="button"
        />
      ) : null}
      <Divider my="xs" />
      <NavLink
        component="a"
        href={docsUrl}
        label={<Trans>Help about Realms</Trans>}
        leftSection={<IconInfoCircle size={16} />}
        rel="noopener"
        target="_blank"
      />
    </Stack>
  );
}
