import { Trans, useLingui } from "@lingui/react/macro";
import { NavLink, Stack, Text } from "@mantine/core";
import { IconServer, IconServer2, IconSettings } from "@tabler/icons-react";

import { SidebarSection } from "@/components/layout/SidebarSection";
import { hashHref } from "@/lib/hashbang";

export interface MachineSidebarProps {
  activeItem: "details" | "list";
  machineCount?: number | undefined;
  machineId?: string | undefined;
}

/**
 * Port of the navigation in `machine.html`. The legacy template printed a
 * literal `$scope.machinecount`; the count is rendered properly here.
 */
export function MachineSidebar({
  activeItem,
  machineCount,
  machineId
}: MachineSidebarProps) {
  const { t } = useLingui();

  return (
    <Stack gap={2}>
      <NavLink
        active={activeItem === "list"}
        component="a"
        href={hashHref("/machine/list")}
        label={t`All Machines`}
        leftSection={<IconServer2 size={16} />}
      />
      {activeItem === "details" ? (
        <NavLink
          active
          label={<Trans>Machine {machineId}</Trans>}
          leftSection={<IconServer size={16} />}
        />
      ) : null}
      <SidebarSection>{t`Quick links`}</SidebarSection>
      <NavLink
        component="a"
        href={hashHref("/config/machineresolvers/list")}
        label={t`Edit Machine Resolvers`}
        leftSection={<IconSettings size={16} />}
      />
      {machineCount !== undefined ? (
        <Text c="dimmed" px="sm" py="xs" size="sm">
          <Trans>Number of machines: {machineCount}</Trans>
        </Text>
      ) : null}
    </Stack>
  );
}
