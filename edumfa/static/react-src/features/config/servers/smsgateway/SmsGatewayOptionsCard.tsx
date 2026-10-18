import { useLingui } from "@lingui/react/macro";

import { KeyValueTable } from "./KeyValueTable";
import { Card } from "@/components/layout/Card";

export interface SmsGatewayOptionsCardProps {
  entries: Record<string, string>;
  onAdd: (name: string, value: string) => void;
  onDelete: (name: string) => void;
}

/** The "Options" card: the free-form options a provider module allows. */
export function SmsGatewayOptionsCard({
  entries,
  onAdd,
  onDelete
}: SmsGatewayOptionsCardProps) {
  const { t } = useLingui();

  return (
    <Card flush title={t`Options`}>
      <KeyValueTable
        entries={entries}
        idPrefix="option"
        nameLabel={t`Option name`}
        onAdd={onAdd}
        onDelete={onDelete}
        valueLabel={t`Option value`}
      />
    </Card>
  );
}
