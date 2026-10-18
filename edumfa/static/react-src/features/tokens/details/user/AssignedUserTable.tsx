import { Trans } from "@lingui/react/macro";
import { Anchor, Table } from "@mantine/core";

import type { TokenDetail } from "@/api/tokens";
import { hashHref } from "@/lib/hashbang";

export interface AssignedUserTableProps {
  token: TokenDetail;
}

/** Username, realm, resolver and user id of the assigned user with cross links. */
export function AssignedUserTable({ token }: AssignedUserTableProps) {
  return (
    <Table verticalSpacing="sm">
      <Table.Tbody>
        <Table.Tr>
          <Table.Td fw={600} w="25%">
            <Trans>Username</Trans>
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
          <Table.Td fw={600}>
            <Trans>Realm</Trans>
          </Table.Td>
          <Table.Td>
            <Anchor href={hashHref("/config/realms/list")} size="sm">
              {token.user_realm}
            </Anchor>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>
            <Trans>Resolver</Trans>
          </Table.Td>
          <Table.Td>
            <Anchor href={hashHref("/config/resolvers/list")} size="sm">
              {token.resolver}
            </Anchor>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td fw={600}>
            <Trans>User Id</Trans>
          </Table.Td>
          <Table.Td data-field="user_id">{token.user_id}</Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
}
