import { useLingui } from "@lingui/react/macro";
import { SimpleGrid } from "@mantine/core";

import { formatMachineHostname, type MachineDetail } from "@/api/machines";
import { FieldValue } from "@/components/forms/FieldValue";
import { Card } from "@/components/layout/Card";

export interface MachineDetailsCardProps {
  machine: MachineDetail;
}

/** Hostname, id and IP address of the machine. */
export function MachineDetailsCard({ machine }: MachineDetailsCardProps) {
  const { t } = useLingui();

  return (
    <Card title={t`Details`}>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing={0}>
        <FieldValue label={t`Hostname`} name="hostname">
          {formatMachineHostname(machine.hostname)}
        </FieldValue>
        <FieldValue label={t`Machine ID`} name="id">
          {machine.id}
        </FieldValue>
        <FieldValue label={t`IP Address`} name="ip">
          {machine.ip}
        </FieldValue>
      </SimpleGrid>
    </Card>
  );
}
