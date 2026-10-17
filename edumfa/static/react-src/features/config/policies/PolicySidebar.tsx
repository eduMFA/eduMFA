import { Trans } from "@lingui/react/macro";
import { IconHelp, IconPlus, IconShieldCheck } from "@tabler/icons-react";
import { Divider, NavLink, Stack } from "@mantine/core";

import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { useDocsUrl } from "@/lib/docs";
import { hashHref } from "@/lib/hashbang";

export function PolicySidebar({ active }: { active: "list" | "add" | "edit" }) {
  const { rights } = useAuth();
  const docsUrl = useDocsUrl("policies/index.html");
  return (
    <Stack gap={2}>
      {hasRight(rights, "policyread") ? (
        <NavLink
          active={active === "list"}
          component="a"
          href={hashHref("/config/policies/list")}
          leftSection={<IconShieldCheck aria-hidden size={16} />}
          label={<Trans>All Policies</Trans>}
        />
      ) : null}
      {hasRight(rights, "policywrite") ? (
        <NavLink
          active={active === "add"}
          component="a"
          href={hashHref("/config/policies/add")}
          leftSection={<IconPlus aria-hidden size={16} />}
          label={<Trans>Create new Policy</Trans>}
        />
      ) : null}
      <Divider my="xs" />
      <NavLink
        component="a"
        href={docsUrl}
        leftSection={<IconHelp aria-hidden size={16} />}
        label={<Trans>Help about Policies</Trans>}
        target="_blank"
        rel="noopener"
      />
    </Stack>
  );
}
