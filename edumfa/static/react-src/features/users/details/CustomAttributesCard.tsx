import { Trans } from "@lingui/react/macro";
import { Table } from "@mantine/core";

import { CustomAttributeForm } from "./CustomAttributeForm";
import { CustomAttributeRow } from "./CustomAttributeRow";
import type { CustomAttributes } from "./useCustomAttributes";
import { Card } from "@/components/layout/Card";
import { EmptyState } from "@/components/tables/EmptyState";

export interface CustomAttributesCardProps {
  attributes: CustomAttributes;
}

/** The custom attributes of the user with the "add" toolbar in the footer. */
export function CustomAttributesCard({ attributes }: CustomAttributesCardProps) {
  const { canDeleteAttribute, deleteMutation, entries, settableKeys } = attributes;

  return (
    <Card
      flush
      footer={
        settableKeys.length > 0 ? (
          <CustomAttributeForm attributes={attributes} />
        ) : undefined
      }
      title={<Trans>Custom attributes</Trans>}
    >
      <Table verticalSpacing="sm">
        <Table.Tbody>
          {entries.length === 0 ? (
            <EmptyState
              colSpan={3}
              message={<Trans>No custom attributes set.</Trans>}
            />
          ) : (
            entries.map(([attributeKey, attributeValue]) => (
              <CustomAttributeRow
                attributeKey={attributeKey}
                attributeValue={attributeValue}
                canDelete={canDeleteAttribute(attributeKey)}
                isDeleting={deleteMutation.isPending}
                key={attributeKey}
                onDelete={() => {
                  deleteMutation.mutate(attributeKey);
                }}
              />
            ))
          )}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
