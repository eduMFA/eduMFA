import { Trans, useLingui } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";

import { type TokenChallenge } from "@/api/tokens";
import { ColumnFilter } from "@/components/tables/ColumnFilter";
import { type DataTableColumn } from "@/components/tables/DataTable";
import { formatLegacyDate } from "@/lib/dates";
import { hashHref } from "@/lib/hashbang";

export interface TokenChallengeColumnOptions {
  onFilterChange: (value: string) => void;
  onFilterSubmit: () => void;
  serialDraft: string;
}

/** The challenge table columns; only the serial column has a filter. */
export function useTokenChallengeColumns({
  onFilterChange,
  onFilterSubmit,
  serialDraft
}: TokenChallengeColumnOptions): DataTableColumn<TokenChallenge>[] {
  const { t } = useLingui();

  return [
    {
      header: <Trans>timestamp</Trans>,
      key: "timestamp",
      nowrap: true,
      render: (challenge) => formatLegacyDate(challenge.timestamp),
      sortKey: "timestamp"
    },
    {
      filter: (
        <ColumnFilter
          label={t`serial`}
          onChange={onFilterChange}
          onSubmit={onFilterSubmit}
          value={serialDraft}
        />
      ),
      header: <Trans>serial</Trans>,
      key: "serial",
      render: (challenge) => (
        <Anchor
          href={hashHref(`/token/details/${encodeURIComponent(challenge.serial)}`)}
          size="sm"
        >
          {challenge.serial}
        </Anchor>
      ),
      sortKey: "serial"
    },
    {
      header: <Trans>Transaction ID</Trans>,
      key: "transaction_id",
      render: (challenge) => challenge.transaction_id,
      sortKey: "transaction_id"
    },
    {
      header: <Trans>Expiration</Trans>,
      key: "expiration",
      nowrap: true,
      render: (challenge) => formatLegacyDate(challenge.expiration),
      sortKey: "expiration"
    },
    {
      align: "right",
      header: <Trans>Received</Trans>,
      key: "received_count",
      render: (challenge) => challenge.received_count,
      sortKey: "received_count"
    }
  ];
}
