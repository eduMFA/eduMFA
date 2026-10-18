import { useLingui } from "@lingui/react/macro";
import { Anchor, Table } from "@mantine/core";

import type { TokenDetail } from "@/api/tokens";
import { hashHref } from "@/lib/hashbang";

export interface AssignedUserTableProps {
  token: TokenDetail;
}

/** Username, realm, resolver and user id of the assigned user with cross links. */
export function AssignedUserTable({ token }: AssignedUserTableProps) {
  const { t } = useLingui();

  return (
    <Table verticalSpacing="sm">
      <Table.Tbody>
        <Table.Tr>
          <Table.Td fw={600} w="25%">
            {t`Username`}
          </Table.Td>
          <Table.Td>
            <Anchor
              href={hashHref(
                `/user/details/${encodeURIComponent(token.user_realm)}/${encodeURIComponent(token.username)}`
              )}
              size="sm"
            >
              {token.username}
            </Anchor>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>{t`Realm`}</Table.Td>
          <Table.Td>
            <Anchor href={hashHref("/config/realms/list")} size="sm">
              {token.user_realm}
            </Anchor>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>{t`Resolver`}</Table.Td>
          <Table.Td>
            <Anchor href={hashHref("/config/resolvers/list")} size="sm">
              {token.resolver}
            </Anchor>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>{t`User Id`}</Table.Td>
          <Table.Td data-field="user_id">{token.user_id}</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
}
