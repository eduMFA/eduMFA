import { Trans } from "@lingui/react/macro";
import { Anchor, Group } from "@mantine/core";
import type { ReactNode } from "react";

import { type TokenFilterName } from "./types";
import { type TokenDetail } from "@/api/tokens";
import { hasRight } from "@/auth/permissions";
import { type DataTableColumn } from "@/components/tables/DataTable";
import { FailCounterBadge } from "@/features/tokens/badges/FailCounterBadge";
import { TokenActiveBadge } from "@/features/tokens/badges/TokenActiveBadge";
import { hashHref } from "@/lib/hashbang";

/** Renders the header filter input of a filterable column. */
export type TokenFilterRenderer = (name: TokenFilterName) => ReactNode;

export interface BaseTokenColumnOptions {
  canReset: boolean;
  filterFor: TokenFilterRenderer;
  onReset: (serial: string) => void;
  onToggleActive: (token: TokenDetail) => void;
  rights: readonly string[];
}

/** The columns every role sees. */
export function getBaseTokenColumns({
  canReset,
  filterFor,
  onReset,
  onToggleActive,
  rights
}: BaseTokenColumnOptions): DataTableColumn<TokenDetail>[] {
  return [
    {
      filter: filterFor("serial"),
      header: <Trans>serial</Trans>,
      key: "serial",
      render: (token) => (
        <Anchor
          href={hashHref(`/token/details/${encodeURIComponent(token.serial)}`)}
          size="sm"
        >
          {token.serial}
        </Anchor>
      ),
      sortKey: "serial"
    },
    {
      filter: filterFor("type"),
      header: <Trans>type</Trans>,
      key: "tokentype",
      render: (token) => token.tokentype,
      sortKey: "tokentype"
    },
    {
      header: <Trans>active</Trans>,
      key: "active",
      render: (token) => (
        <TokenActiveBadge
          active={token.active}
          onToggle={
            hasRight(rights, token.active ? "disable" : "enable")
              ? () => {
                  onToggleActive(token);
                }
              : undefined
          }
        />
      ),
      sortKey: "active"
    },
    {
      filter: filterFor("description"),
      header: <Trans>description</Trans>,
      key: "description",
      render: (token) => token.description,
      sortKey: "description"
    },
    {
      header: <Trans>failcounter</Trans>,
      key: "failcount",
      render: (token) => (
        <FailCounterBadge
          onReset={
            canReset
              ? () => {
                  onReset(token.serial);
                }
              : undefined
          }
          token={token}
        />
      ),
      sortKey: "failcount"
    },
    {
      filter: filterFor("rollout_state"),
      header: <Trans>rollout state</Trans>,
      key: "rollout_state",
      render: (token) => token.rollout_state,
      sortKey: "rollout_state"
    }
  ];
}

/** The owner columns, shown to administrators only. */
export function getTokenOwnerColumns(
  filterFor: TokenFilterRenderer
): DataTableColumn<TokenDetail>[] {
  return [
    {
      header: <Trans>user</Trans>,
      key: "username",
      render: (token) =>
        token.username ? (
          <Anchor
            href={hashHref(
              `/user/details/${encodeURIComponent(token.user_realm)}/${encodeURIComponent(token.username)}`
            )}
            size="sm"
          >
            {token.username}
          </Anchor>
        ) : null
    },
    {
      header: <Trans>realm</Trans>,
      key: "user_realm",
      render: (token) =>
        token.user_realm ? (
          <Anchor href={hashHref("/config/realms/list")} size="sm">
            {token.user_realm}
          </Anchor>
        ) : null
    },
    {
      filter: filterFor("tokenrealm"),
      header: <Trans>Token realms</Trans>,
      key: "realms",
      render: (token) => (
        <Group gap={4}>
          {token.realms.map((realm) => (
            <Anchor href={hashHref("/config/realms/list")} key={realm} size="sm">
              {realm}
            </Anchor>
          ))}
        </Group>
      )
    }
  ];
}

/** The resolver-level user columns added by the `user_details` WebUI policy. */
export function getTokenUserDetailColumns(): DataTableColumn<TokenDetail>[] {
  return [
    {
      header: <Trans>UserId</Trans>,
      key: "user_id",
      render: (token) => token.user_id
    },
    {
      header: <Trans>Resolver</Trans>,
      key: "resolver",
      render: (token) =>
        token.resolver ? (
          <Anchor href={hashHref("/config/resolvers/list")} size="sm">
            {token.resolver}
          </Anchor>
        ) : null
    }
  ];
}
