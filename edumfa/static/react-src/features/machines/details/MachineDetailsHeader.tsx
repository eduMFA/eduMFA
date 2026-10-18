import { Trans } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";

import { PageHeader } from "@/components/layout/PageHeader";
import { hashHref } from "@/lib/hashbang";

export interface MachineDetailsHeaderProps {
  machineId: string;
  machineResolver: string;
}

/** Title row linking back to the machine list filtered by resolver. */
export function MachineDetailsHeader({
  machineId,
  machineResolver
}: MachineDetailsHeaderProps) {
  return (
    <PageHeader
      subtitle={
        <>
          <Trans>Machine Resolver</Trans>{" "}
          <Anchor
            href={hashHref(
              `/machine/list?resolver=${encodeURIComponent(machineResolver)}`
            )}
            size="sm"
          >
            {machineResolver}
          </Anchor>
        </>
      }
      title={<Trans>Machine {machineId}</Trans>}
    />
  );
}
