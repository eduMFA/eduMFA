import { Trans } from "@lingui/react/macro";
import { Anchor, Box, Group, SimpleGrid, Table, Text } from "@mantine/core";
import { useQueries, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { ReactNode } from "react";

import { useApiClient } from "@/api/ApiClientProvider";
import {
  auditQueryKeys,
  getAuditLog,
  type AuditEntry,
  type AuditLogParams
} from "@/api/audit";
import { configQueryKeys, getEvents, getPolicies } from "@/api/config";
import { getTokens, tokenQueryKeys, type TokenListParams } from "@/api/tokens";
import { useAuth } from "@/auth/AuthProvider";
import { hasRight } from "@/auth/permissions";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoginRequiredAlert } from "@/components/feedback/LoginRequiredAlert";
import { Card } from "@/components/layout/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { hashHref } from "@/lib/hashbang";

/** Token counts are read with `pagesize=0`, which skips the user resolving. */
const tokenCountParams: Record<TokenCountKey, TokenListParams> = {
  hardware: { infokey: "tokenkind", infovalue: "hardware", pagesize: 0 },
  software: { infokey: "tokenkind", infovalue: "software", pagesize: 0 },
  total: { pagesize: 0 },
  unassignedHardware: {
    assigned: "False",
    infokey: "tokenkind",
    infovalue: "hardware",
    pagesize: 0
  },
  unassignedSoftware: {
    assigned: "False",
    infokey: "tokenkind",
    infovalue: "software",
    pagesize: 0
  }
};

type TokenCountKey =
  "hardware" | "software" | "total" | "unassignedHardware" | "unassignedSoftware";

const tokenCountKeys = Object.keys(tokenCountParams) as TokenCountKey[];

/** The administrative actions the legacy dashboard listed. */
const administrationActions = ["system", "resolver", "realm", "policy", "event"];

/**
 * Port of `dashboard.html`: the admin start page with token counts, the
 * authentications of the last day, recent administration and the policy
 * and event overview. Each panel is gated by the same right as the legacy
 * template.
 */
export function DashboardPage() {
  const apiClient = useApiClient();
  const { isAuthenticated, rights } = useAuth();
  const canListTokens = isAuthenticated && hasRight(rights, "tokenlist");
  const canReadAudit = isAuthenticated && hasRight(rights, "auditlog");
  const canReadPolicies = isAuthenticated && hasRight(rights, "policyread");
  const canReadEvents = isAuthenticated && hasRight(rights, "eventhandling_read");

  const tokenCountQueries = useQueries({
    queries: tokenCountKeys.map((key) => ({
      enabled: canListTokens,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getTokens(apiClient, tokenCountParams[key], signal),
      queryKey: tokenQueryKeys.list(tokenCountParams[key])
    }))
  });
  const tokenCounts = Object.fromEntries(
    tokenCountKeys.map((key, index) => [key, tokenCountQueries[index]?.data?.count])
  ) as Record<TokenCountKey, number | undefined>;

  const successParams: AuditLogParams = {
    action: "*validate/*check",
    success: "1",
    timelimit: "1d"
  };
  const failureParams: AuditLogParams = {
    action: "*validate/*check",
    success: "0",
    timelimit: "1d"
  };
  const successQuery = useQuery({
    enabled: canReadAudit,
    queryFn: ({ signal }) => getAuditLog(apiClient, successParams, signal),
    queryKey: auditQueryKeys.log(successParams)
  });
  const failureQuery = useQuery({
    enabled: canReadAudit,
    queryFn: ({ signal }) => getAuditLog(apiClient, failureParams, signal),
    queryKey: auditQueryKeys.log(failureParams)
  });
  const failures = summarizeFailures(failureQuery.data?.auditdata ?? []);

  const administrationQueries = useQueries({
    queries: administrationActions.map((action) => {
      const params: AuditLogParams = { action: `POST /${action}*`, timelimit: "1d" };

      return {
        enabled: canReadAudit,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          getAuditLog(apiClient, params, signal),
        queryKey: auditQueryKeys.log(params)
      };
    })
  });
  const administration = administrationQueries
    .flatMap((query) => query.data?.auditdata ?? [])
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);

  const policiesQuery = useQuery({
    enabled: canReadPolicies,
    queryFn: ({ signal }) => getPolicies(apiClient, signal),
    queryKey: configQueryKeys.policies
  });
  const eventsQuery = useQuery({
    enabled: canReadEvents,
    queryFn: ({ signal }) => getEvents(apiClient, signal),
    queryKey: configQueryKeys.events
  });
  const policies = policiesQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const activePolicies = policies.filter((policy) => policy.active);
  const inactivePolicies = policies.filter((policy) => !policy.active);
  const activeEvents = events.filter((event) => event.active);
  const inactiveEvents = events.filter((event) => !event.active);

  const firstError = [
    ...tokenCountQueries,
    successQuery,
    failureQuery,
    ...administrationQueries,
    policiesQuery,
    eventsQuery
  ].find((query) => query.error)?.error;

  return (
    <Box className="react-migration-shell">
      <PageHeader title={<Trans>Dashboard</Trans>} />

      {!isAuthenticated ? <LoginRequiredAlert /> : null}
      <ErrorAlert error={firstError} />

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        {canListTokens ? (
          <Card
            flush
            title={
              <Anchor href={hashHref("/token/list")} size="sm">
                <Trans>Tokens</Trans>
              </Anchor>
            }
          >
            <Table verticalSpacing="xs">
              <Table.Tbody>
                <StatRow label={<Trans>Total</Trans>} name="total">
                  <Anchor href={hashHref("/token/list")} size="sm">
                    {tokenCounts.total}
                  </Anchor>
                </StatRow>
                <StatRow label={<Trans>Hardware</Trans>} name="hardware">
                  {tokenCounts.hardware}
                </StatRow>
                <StatRow label={<Trans>Software</Trans>} name="software">
                  {tokenCounts.software}
                </StatRow>
                <StatRow
                  label={<Trans>Unassigned Hardware</Trans>}
                  name="unassignedHardware"
                >
                  {tokenCounts.unassignedHardware}
                </StatRow>
                <StatRow
                  label={<Trans>Unassigned Software</Trans>}
                  name="unassignedSoftware"
                >
                  {tokenCounts.unassignedSoftware}
                </StatRow>
              </Table.Tbody>
            </Table>
          </Card>
        ) : null}

        {canReadAudit ? (
          <Card flush title={<Trans>Authentications</Trans>}>
            <Text c="dimmed" px="md" pt="sm" size="sm">
              <Trans>Authentications in the last 24 hours</Trans>
            </Text>
            <Table verticalSpacing="xs">
              <Table.Tbody>
                <StatRow label={<Trans>success</Trans>} name="authSuccess">
                  {successQuery.data?.count}
                </StatRow>
                <StatRow label={<Trans>failed</Trans>} name="authFailed">
                  {failureQuery.data?.count}
                </StatRow>
                <StatRow
                  label={<Trans>failed users / tokens</Trans>}
                  name="authFailures"
                >
                  <Group gap={6}>
                    {failures.users.map((failure) => (
                      <Anchor
                        href={hashHref(
                          `/user/details/${encodeURIComponent(failure.realm)}/${encodeURIComponent(failure.user)}`
                        )}
                        key={`${failure.user}@${failure.realm}`}
                        size="sm"
                      >
                        {failure.user}@{failure.realm}[{failure.fails}]
                      </Anchor>
                    ))}
                    {failures.serials.map((serial, index) => (
                      <Anchor
                        href={hashHref(`/token/details/${encodeURIComponent(serial)}`)}
                        key={`${serial}-${String(index)}`}
                        size="sm"
                      >
                        {serial}
                      </Anchor>
                    ))}
                  </Group>
                </StatRow>
              </Table.Tbody>
            </Table>
          </Card>
        ) : null}

        {canReadAudit ? (
          <Card flush title={<Trans>Administration</Trans>}>
            {/* Paths like POST /policy/<name> do not wrap; the table scrolls inside the card. */}
            <Table.ScrollContainer minWidth={480}>
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Trans>Date</Trans>
                    </Table.Th>
                    <Table.Th>
                      <Trans>Administrator</Trans>
                    </Table.Th>
                    <Table.Th>
                      <Trans>Action</Trans>
                    </Table.Th>
                    <Table.Th>
                      <Trans>Detail</Trans>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {administration.map((entry) => (
                    <Table.Tr key={entry.number}>
                      <Table.Td style={{ whiteSpace: "nowrap" }}>
                        {formatDashboardDate(entry.date)}
                      </Table.Td>
                      <Table.Td>{entry.administrator}</Table.Td>
                      <Table.Td>{entry.action}</Table.Td>
                      <Table.Td>{entry.action_detail}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
        ) : null}

        {canReadPolicies ? (
          <Card
            flush
            title={
              <Anchor href={hashHref("/config/policies/list")} size="sm">
                <Trans>Policies</Trans>
              </Anchor>
            }
          >
            <Table verticalSpacing="xs">
              <Table.Tbody>
                <StatRow label={<Trans>Active Policies</Trans>} name="activePolicies">
                  {activePolicies.length}
                </StatRow>
                <LinkListRow
                  links={activePolicies.map((policy) => ({
                    href: hashHref(
                      `/config/policies/details/${encodeURIComponent(policy.name)}`
                    ),
                    key: policy.name,
                    label: policy.name
                  }))}
                />
                <StatRow
                  label={<Trans>Inactive Policies</Trans>}
                  name="inactivePolicies"
                >
                  {inactivePolicies.length}
                </StatRow>
                <LinkListRow
                  links={inactivePolicies.map((policy) => ({
                    href: hashHref(
                      `/config/policies/details/${encodeURIComponent(policy.name)}`
                    ),
                    key: policy.name,
                    label: policy.name
                  }))}
                />
              </Table.Tbody>
            </Table>
          </Card>
        ) : null}

        {canReadEvents ? (
          <Card flush title={<Trans>Events</Trans>}>
            <Table verticalSpacing="xs">
              <Table.Tbody>
                <StatRow label={<Trans>Active Events</Trans>} name="activeEvents">
                  {activeEvents.length}
                </StatRow>
                <LinkListRow
                  links={activeEvents.map((event) => ({
                    href: hashHref(`/config/events/details/${String(event.id)}`),
                    key: String(event.id),
                    label: event.name
                  }))}
                />
                <StatRow label={<Trans>Inactive Events</Trans>} name="inactiveEvents">
                  {inactiveEvents.length}
                </StatRow>
                <LinkListRow
                  links={inactiveEvents.map((event) => ({
                    href: hashHref(`/config/events/details/${String(event.id)}`),
                    key: String(event.id),
                    label: event.name
                  }))}
                />
              </Table.Tbody>
            </Table>
          </Card>
        ) : null}
      </SimpleGrid>
    </Box>
  );
}

function StatRow({
  children,
  label,
  name
}: {
  children: ReactNode;
  label: ReactNode;
  name: string;
}) {
  return (
    <Table.Tr>
      <Table.Td fw={600}>{label}</Table.Td>
      <Table.Td data-field={name} ta="right">
        {children}
      </Table.Td>
    </Table.Tr>
  );
}

function LinkListRow({
  links
}: {
  links: { href: string; key: string; label: string }[];
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <Table.Tr>
      <Table.Td colSpan={2}>
        <Group gap={6}>
          {links.map((link) => (
            <Anchor href={link.href} key={link.key} size="sm">
              {link.label}
            </Anchor>
          ))}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

interface FailedUser {
  fails: number;
  latestError: string;
  realm: string;
  user: string;
}

/**
 * Groups the failed authentications by user (newest failure first) and
 * collects the serials of failures without a user, like the legacy
 * controller.
 */
export function summarizeFailures(entries: readonly AuditEntry[]): {
  serials: string[];
  users: FailedUser[];
} {
  const users = new Map<string, FailedUser>();
  const serials: string[] = [];

  for (const entry of entries) {
    if (!entry.user) {
      if (entry.serial) {
        serials.push(entry.serial);
      }

      continue;
    }

    const realm = entry.realm ?? "";
    const key = `${entry.user}-${realm}`;
    const known = users.get(key);

    if (known) {
      known.fails += 1;

      if (entry.date > known.latestError) {
        known.latestError = entry.date;
      }
    } else {
      users.set(key, { fails: 1, latestError: entry.date, realm, user: entry.user });
    }
  }

  return {
    serials,
    users: [...users.values()].sort((left, right) =>
      right.latestError.localeCompare(left.latestError)
    )
  };
}

/** Like the legacy `date: "y-MM-d HH:mm"` filter, without seconds. */
function formatDashboardDate(value: string): string {
  const date = dayjs(value);

  return date.isValid() ? date.format("YYYY-MM-DD HH:mm") : value;
}
