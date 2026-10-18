import { useLingui } from "@lingui/react/macro";
import { Button, Table } from "@mantine/core";

export interface CustomAttributeRowProps {
  attributeKey: string;
  attributeValue: string;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}

/** One custom attribute with its delete button, when the policy allows it. */
export function CustomAttributeRow({
  attributeKey,
  attributeValue,
  canDelete,
  isDeleting,
  onDelete
}: CustomAttributeRowProps) {
  const { t } = useLingui();

  return (
    <Table.Tr>
      <Table.Td fw={600} w="30%">
        {attributeKey}
      </Table.Td>
      <Table.Td>{attributeValue}</Table.Td>
      <Table.Td ta="right" w="20%">
        {canDelete ? (
          <Button
            color="red"
            loading={isDeleting}
            onClick={onDelete}
            size="xs"
            variant="light"
          >
            {t`Delete`}
          </Button>
        ) : null}
      </Table.Td>
    </Table.Tr>
  );
}
