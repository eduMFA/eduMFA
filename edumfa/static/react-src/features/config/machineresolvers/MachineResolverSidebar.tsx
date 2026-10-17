import { Trans } from "@lingui/react/macro";
import { NavLink, Stack } from "@mantine/core";
import { IconEdit, IconList, IconPlus } from "@tabler/icons-react";

import { machineResolverTypes } from "@/api/machineResolvers";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { SidebarSection } from "@/components/layout/SidebarSection";
import { hashHref } from "@/lib/hashbang";

export type MachineResolverSidebarItem = "hosts" | "ldap" | "list";

export interface MachineResolverSidebarProps {
  activeItem: MachineResolverSidebarItem;
  /** Name of the resolver being edited; adds the "Edit Resolver" entry. */
  resolverName?: string | undefined;
}

/**
 * Port of `config.machineresolvers.html`: the list entry, the entry of the
 * resolver being edited and one "New ... Resolver" link per type for
 * sessions with the `mresolverwrite` right.
 */
export function MachineResolverSidebar({
  activeItem,
  resolverName
}: MachineResolverSidebarProps) {
  const { rights } = useAuth();
  const isEditing = resolverName !== undefined && resolverName !== "";

  return (
    <Stack gap={2}>
      <NavLink
        active={activeItem === "list"}
        component="a"
        href={hashHref("/config/machineresolvers/list")}
        label={<Trans>All Machine Resolvers</Trans>}
        leftSection={<IconList size={16} />}
      />
      {isEditing ? (
        <NavLink
          active
          label={<Trans>Edit Resolver {resolverName}</Trans>}
          leftSection={<IconEdit size={16} />}
        />
      ) : null}
      {hasRight(rights, "mresolverwrite") ? (
        <>
          <SidebarSection>
            <Trans>New Resolvers</Trans>
          </SidebarSection>
          {machineResolverTypes.map((resolverType) => {
            const typeLabel = resolverType.toUpperCase();

            return (
              <NavLink
                active={!isEditing && activeItem === resolverType}
                component="a"
                href={hashHref(`/config/machineresolvers/${resolverType}`)}
                key={resolverType}
                label={<Trans>New {typeLabel} Resolver</Trans>}
                leftSection={<IconPlus size={16} />}
              />
            );
          })}
        </>
      ) : null}
    </Stack>
  );
}
