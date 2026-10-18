import { Trans } from "@lingui/react/macro";
import { NavLink, Stack } from "@mantine/core";
import { IconDownload, IconTool } from "@tabler/icons-react";
import type { PropsWithChildren } from "react";

import { CaConnectorLinks } from "./CaConnectorLinks";
import { ServerSectionLinks } from "./ServerSectionLinks";
import { serverSections, type ServerSectionKey } from "./systemSections";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { hashHref } from "@/lib/hashbang";

export type SystemSidebarItem =
  "caconnectors" | "documentation" | "system" | ServerSectionKey;

export interface SystemLayoutProps {
  activeItem: SystemSidebarItem;
}

/**
 * Port of `config.system.html`: the sidebar of the system area with the
 * server definitions, token groups, service IDs and CA connectors, each
 * with its list, "new" and help entries, plus the routed page next to it.
 */
export function SystemLayout({
  activeItem,
  children
}: PropsWithChildren<SystemLayoutProps>) {
  const { rights } = useAuth();

  return (
    <SidebarLayout
      sidebar={
        <Stack gap={2}>
          <NavLink
            active={activeItem === "system"}
            component="a"
            href={hashHref("/config/system/edit")}
            label={<Trans>System Config</Trans>}
            leftSection={<IconTool size={16} />}
          />
          {hasRight(rights, "system_documentation") ? (
            <NavLink
              active={activeItem === "documentation"}
              component="a"
              href={hashHref("/config/system/documentation")}
              label={<Trans>Get System Documentation</Trans>}
              leftSection={<IconDownload size={16} />}
            />
          ) : null}
          {serverSections
            .filter((section) => hasRight(rights, section.readRight))
            .map((section) => (
              <ServerSectionLinks
                active={activeItem === section.key}
                canAdd={hasRight(rights, section.addRight)}
                key={section.key}
                section={section}
              />
            ))}
          <CaConnectorLinks
            active={activeItem === "caconnectors"}
            canAdd={hasRight(rights, "caconnectorwrite")}
          />
        </Stack>
      }
    >
      {children}
    </SidebarLayout>
  );
}
