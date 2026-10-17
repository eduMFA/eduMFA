import { Trans } from "@lingui/react/macro";
import { Divider, NavLink, Stack } from "@mantine/core";
import { IconEdit, IconInfoCircle, IconList, IconPlus } from "@tabler/icons-react";

import { resolverEditorPath } from "./resolverTypes";
import { resolverTypes, type ResolverType } from "@/api/resolvers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { SidebarSection } from "@/components/layout/SidebarSection";
import { useDocsUrl } from "@/lib/docs";
import { hashHref } from "@/lib/hashbang";

export interface ResolverSidebarProps {
  activeItem: "list" | ResolverType;
  /** Set on the edit pages; shows the "Edit Resolver ..." entry. */
  resolverName?: string | undefined;
}

/**
 * Port of the navigation in `config.resolvers.html`: the resolver list, the
 * resolver being edited, one "New <type>" entry per resolver type and the
 * documentation link.
 */
export function ResolverSidebar({ activeItem, resolverName }: ResolverSidebarProps) {
  const { rights } = useAuth();
  const helpUrl = useDocsUrl("configuration/useridresolvers.html");
  const isEditing = resolverName !== undefined && resolverName !== "";

  return (
    <Stack gap={2}>
      <NavLink
        active={activeItem === "list"}
        component="a"
        href={hashHref("/config/resolvers/list")}
        label={<Trans>All Resolvers</Trans>}
        leftSection={<IconList size={16} />}
      />
      {isEditing ? (
        <NavLink
          active
          label={<Trans>Edit Resolver {resolverName}</Trans>}
          leftSection={<IconEdit size={16} />}
        />
      ) : null}
      {hasRight(rights, "resolverwrite") ? (
        <>
          <SidebarSection>
            <Trans>New Resolvers</Trans>
          </SidebarSection>
          {resolverTypes.map((resolverType) => (
            <NavLink
              active={activeItem === resolverType && !isEditing}
              component="a"
              href={hashHref(resolverEditorPath(resolverType))}
              key={resolverType}
              label={<Trans>New {resolverType}</Trans>}
              leftSection={<IconPlus size={16} />}
            />
          ))}
        </>
      ) : null}
      <Divider my="xs" />
      <NavLink
        component="a"
        href={helpUrl}
        label={<Trans>Help about UserResolver</Trans>}
        leftSection={<IconInfoCircle size={16} />}
        rel="noopener"
        target="_blank"
      />
    </Stack>
  );
}
