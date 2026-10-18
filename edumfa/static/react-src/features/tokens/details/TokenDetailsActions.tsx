import { useLingui } from "@lingui/react/macro";
import { Button } from "@mantine/core";
import { IconRefresh, IconSearch, IconTrash } from "@tabler/icons-react";

import type { TokenDetail } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasEnrollRight, hasRight } from "@/auth/permissions";
import { hashHref } from "@/lib/hashbang";

export interface TokenDetailsActionsProps {
  isDeleting: boolean;
  onDelete: () => void;
  serial: string;
  token: TokenDetail | null;
}

/** Header actions: the audit log link, the rollover link and the delete button. */
export function TokenDetailsActions({
  isDeleting,
  onDelete,
  serial,
  token
}: TokenDetailsActionsProps) {
  const { t } = useLingui();

  const { rights, settings } = useAuth();
  const canDelete = hasRight(rights, "delete");
  const rolloverHref =
    token !== null &&
    hasEnrollRight(rights) &&
    settings.tokenRollover.includes(token.tokentype) &&
    token.info.tokenkind === "software"
      ? hashHref(
          `/token/rollover/${encodeURIComponent(token.tokentype)}/${encodeURIComponent(serial)}`
        )
      : null;

  return (
    <>
      {hasRight(rights, "auditlog") ? (
        <Button
          component="a"
          href={hashHref(`/audit/log?serial=${encodeURIComponent(serial)}`)}
          leftSection={<IconSearch size={16} />}
          variant="default"
        >
          {t`View token in Audit log`}
        </Button>
      ) : null}
      {rolloverHref ? (
        <Button
          color="red"
          component="a"
          href={rolloverHref}
          id="rolloverButton"
          leftSection={<IconRefresh size={16} />}
          variant="light"
        >
          {t`Rollover`}
        </Button>
      ) : null}
      {token && (canDelete || !settings.hideButtons) ? (
        <Button
          color="red"
          disabled={!canDelete}
          id="deleteButton"
          leftSection={<IconTrash size={16} />}
          loading={isDeleting}
          onClick={onDelete}
        >
          {t`Delete`}
        </Button>
      ) : null}
    </>
  );
}
