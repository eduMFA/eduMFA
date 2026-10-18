import { Trans } from "@lingui/react/macro";
import { Divider, NavLink, Stack } from "@mantine/core";
import { IconBolt, IconCalendarTime, IconHelp, IconPlus } from "@tabler/icons-react";
import type { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useDocsUrl } from "@/lib/docs";
import { hashHref } from "@/lib/hashbang";

export type DefinitionKind = "events" | "periodictasks";

/** Names of the read and write rights that guard a definition type. */
export function definitionRights(kind: DefinitionKind) {
  const prefix = kind === "events" ? "eventhandling" : "periodictask";
  return { read: `${prefix}_read`, write: `${prefix}_write` };
}

/** Sidebar (list, create, help) around the pages of one definition type. */
export function DefinitionLayout({
  kind,
  children
}: PropsWithChildren<{ kind: DefinitionKind }>) {
  const { rights } = useAuth();
  const { pathname } = useLocation();
  const access = definitionRights(kind);

  const docsUrl = useDocsUrl(
    kind === "events" ? "eventhandler/index.html" : "periodictask/index.html"
  );
  const Icon = kind === "events" ? IconBolt : IconCalendarTime;

  return (
    <SidebarLayout
      sidebar={
        <Stack gap={2}>
          {hasRight(rights, access.read) ? (
            <NavLink
              component="a"
              href={hashHref(`/config/${kind}/list`)}
              active={pathname.endsWith("/list") || pathname.endsWith(kind)}
              leftSection={<Icon aria-hidden size={16} />}
              label={
                kind === "events" ? (
                  <Trans>Event Handlers</Trans>
                ) : (
                  <Trans>Periodic Tasks</Trans>
                )
              }
            />
          ) : null}

          {hasRight(rights, access.write) ? (
            <NavLink
              component="a"
              href={hashHref(`/config/${kind}/add`)}
              active={pathname.endsWith("/add")}
              leftSection={<IconPlus aria-hidden size={16} />}
              label={
                kind === "events" ? (
                  <Trans>Create Event Handler</Trans>
                ) : (
                  <Trans>Create Periodic Task</Trans>
                )
              }
            />
          ) : null}

          <Divider my="xs" />
          <NavLink
            component="a"
            href={docsUrl}
            target="_blank"
            rel="noopener"
            leftSection={<IconHelp aria-hidden size={16} />}
            label={<Trans>Help</Trans>}
          />
        </Stack>
      }
    >
      {children}
    </SidebarLayout>
  );
}
