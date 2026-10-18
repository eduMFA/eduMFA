import { useLingui } from "@lingui/react/macro";
import { Anchor, Button } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { hashHref } from "@/lib/hashbang";

export interface UserDetailsHeaderProps {
  realm: string;
  resolverName: string;
  username: string;
}

/** Title row with the realm/resolver line and the audit log cross link. */
export function UserDetailsHeader({
  realm,
  resolverName,
  username
}: UserDetailsHeaderProps) {
  const { t } = useLingui();

  return (
    <PageHeader
      actions={
        <Button
          component="a"
          href={hashHref(`/audit/log?user=${encodeURIComponent(username)}`)}
          leftSection={<IconSearch size={16} />}
          variant="default"
        >
          {t`View user in Audit log`}
        </Button>
      }
      subtitle={
        <>
          {t`Realm`}{" "}
          <Anchor href={hashHref("/config/realms/list")} size="sm">
            {realm}
          </Anchor>
          {resolverName ? (
            <>
              {" · "}
              {t`Resolver`} {resolverName}
            </>
          ) : null}
        </>
      }
      title={username}
    />
  );
}
