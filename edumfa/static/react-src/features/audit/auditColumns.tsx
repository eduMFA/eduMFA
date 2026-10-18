import { Trans } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";
import type { ReactNode } from "react";

import { CheckLabel } from "./CheckLabel";
import { PolicyLinks } from "./PolicyLinks";
import { SerialLinks } from "./SerialLinks";
import type { AuditFilterName } from "./auditFilters";
import { isAuditSuccess, type AuditEntry } from "@/api/audit";
import { BooleanPill } from "@/components/feedback/BooleanPill";
import { formatLegacyDate } from "@/lib/dates";
import { hashHref } from "@/lib/hashbang";

export interface AuditColumnConfig {
  adminOnly?: boolean;
  filterName?: AuditFilterName;
  key: string;
  label: ReactNode;
  nowrap?: boolean;
  render: (entry: AuditEntry, isAdmin: boolean) => ReactNode;
}

/** All audit columns; the backend's `auditcolumns` decides which are shown. */
export const auditColumnConfigs: AuditColumnConfig[] = [
  {
    key: "number",
    label: <Trans>number</Trans>,
    nowrap: true,
    render: (entry) => entry.number
  },
  {
    filterName: "startdate",
    key: "startdate",
    label: <Trans>startdate</Trans>,
    nowrap: true,
    render: (entry) => formatLegacyDate(entry.startdate)
  },
  {
    filterName: "date",
    key: "date",
    label: <Trans>enddate</Trans>,
    nowrap: true,
    render: (entry) => formatLegacyDate(entry.date)
  },
  {
    filterName: "duration",
    key: "duration",
    label: <Trans>duration</Trans>,
    nowrap: true,
    render: (entry) => entry.duration
  },
  {
    filterName: "action",
    key: "action",
    label: <Trans>action</Trans>,
    render: (entry) => entry.action
  },
  {
    filterName: "success",
    key: "success",
    label: <Trans>success</Trans>,
    render: (entry) => (
      <BooleanPill
        falseLabel={<Trans>failed</Trans>}
        trueLabel={<Trans>success</Trans>}
        value={isAuditSuccess(entry)}
      />
    )
  },
  {
    filterName: "action_detail",
    key: "action_detail",
    label: <Trans>action detail</Trans>,
    render: (entry) => entry.action_detail
  },
  {
    filterName: "serial",
    key: "serial",
    label: <Trans>serial</Trans>,
    render: (entry) => <SerialLinks serial={entry.serial} />
  },
  {
    filterName: "tokentype",
    key: "token_type",
    label: <Trans>token type</Trans>,
    render: (entry) => entry.token_type
  },
  {
    filterName: "administrator",
    key: "administrator",
    label: <Trans>administrator</Trans>,
    render: (entry) => entry.administrator
  },
  {
    filterName: "user",
    key: "user",
    label: <Trans>user</Trans>,
    render: (entry) =>
      entry.user ? (
        <Anchor
          href={hashHref(
            `/user/details/${encodeURIComponent(entry.realm ?? "")}/${encodeURIComponent(entry.user)}`
          )}
          size="sm"
        >
          {entry.user}
        </Anchor>
      ) : null
  },
  {
    filterName: "realm",
    key: "realm",
    label: <Trans>realm</Trans>,
    render: (entry, isAdmin) =>
      isAdmin && entry.realm ? (
        <Anchor href={hashHref("/config/realms/list")} size="sm">
          {entry.realm}
        </Anchor>
      ) : (
        entry.realm
      )
  },
  {
    filterName: "resolver",
    key: "resolver",
    label: <Trans>resolver</Trans>,
    render: (entry, isAdmin) =>
      isAdmin && entry.resolver ? (
        <Anchor href={hashHref("/config/resolvers/list")} size="sm">
          {entry.resolver}
        </Anchor>
      ) : (
        entry.resolver
      )
  },
  {
    adminOnly: true,
    filterName: "policies",
    key: "policies",
    label: <Trans>policies</Trans>,
    render: (entry) => <PolicyLinks policies={entry.policies} />
  },
  {
    filterName: "client",
    key: "client",
    label: <Trans>client</Trans>,
    render: (entry) => entry.client
  },
  {
    filterName: "info",
    key: "info",
    label: <Trans>info</Trans>,
    render: (entry) => entry.info
  },
  {
    key: "sig_check",
    label: <Trans>sig_check</Trans>,
    render: (entry) => <CheckLabel value={entry.sig_check} />
  },
  {
    key: "missing_line",
    label: <Trans>missing_line</Trans>,
    render: (entry) => <CheckLabel value={entry.missing_line} />
  },
  {
    key: "thread_id",
    label: <Trans>thread_id</Trans>,
    render: (entry) => entry.thread_id
  },
  {
    key: "clearance_level",
    label: <Trans>clearance</Trans>,
    render: (entry) => entry.clearance_level
  },
  {
    key: "log_level",
    label: <Trans>log level</Trans>,
    render: (entry) => entry.log_level
  },
  {
    filterName: "edumfa_server",
    key: "edumfa_server",
    label: <Trans>eduMFA server</Trans>,
    render: (entry) => entry.edumfa_server
  }
];

/** The column label of a filter, for the active filter chips. */
export function getFilterLabel(name: AuditFilterName): ReactNode {
  return auditColumnConfigs.find((column) => column.filterName === name)?.label ?? name;
}
