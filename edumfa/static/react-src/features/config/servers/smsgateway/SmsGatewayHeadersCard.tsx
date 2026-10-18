import { useLingui } from "@lingui/react/macro";

import { KeyValueTable } from "./KeyValueTable";
import { Card } from "@/components/layout/Card";

export interface SmsGatewayHeadersCardProps {
  entries: Record<string, string>;
  onAdd: (name: string, value: string) => void;
  onDelete: (name: string) => void;
}

/** The "Headers" card: the HTTP headers a provider module allows. */
export function SmsGatewayHeadersCard({
  entries,
  onAdd,
  onDelete
}: SmsGatewayHeadersCardProps) {
  const { t } = useLingui();

  return (
    <Card flush title={t`Headers`}>
      <KeyValueTable
        entries={entries}
        idPrefix="header"
        nameLabel={t`Header name`}
        onAdd={onAdd}
        onDelete={onDelete}
        valueLabel={t`Header value`}
      />
    </Card>
  );
}
