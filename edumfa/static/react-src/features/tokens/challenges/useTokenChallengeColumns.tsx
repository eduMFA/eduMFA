import { useLingui } from "@lingui/react/macro";
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
      header: t`timestamp`,
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
      header: t`serial`,
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
      header: t`Transaction ID`,
      key: "transaction_id",
      render: (challenge) => challenge.transaction_id,
      sortKey: "transaction_id"
    },
    {
      header: t`Expiration`,
      key: "expiration",
      nowrap: true,
      render: (challenge) => formatLegacyDate(challenge.expiration),
      sortKey: "expiration"
    },
    {
      align: "right",
      header: t`Received`,
      key: "received_count",
      render: (challenge) => challenge.received_count,
      sortKey: "received_count"
    }
  ];
}
