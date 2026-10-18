import { Trans } from "@lingui/react/macro";
import { SimpleGrid } from "@mantine/core";

import { formatMachineHostname, type MachineDetail } from "@/api/machines";
import { FieldValue } from "@/components/forms/FieldValue";
import { Card } from "@/components/layout/Card";

export interface MachineDetailsCardProps {
  machine: MachineDetail;
}

/** Hostname, id and IP address of the machine. */
export function MachineDetailsCard({ machine }: MachineDetailsCardProps) {
  return (
    <Card title={<Trans>Details</Trans>}>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing={0}>
        <FieldValue label={<Trans>Hostname</Trans>} name="hostname">
          {formatMachineHostname(machine.hostname)}
        </FieldValue>
        <FieldValue label={<Trans>Machine ID</Trans>} name="id">
          {machine.id}
        </FieldValue>
        <FieldValue label={<Trans>IP Address</Trans>} name="ip">
          {machine.ip}
        </FieldValue>
      </SimpleGrid>
    </Card>
  );
}
