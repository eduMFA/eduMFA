import { Trans } from "@lingui/react/macro";
import { Anchor } from "@mantine/core";

import type { TokenDetail } from "@/api/tokens";
import { BooleanPill } from "@/components/feedback/BooleanPill";
import type { DataTableColumn } from "@/components/tables/DataTable";
import { FailCounterBadge } from "@/features/tokens/badges/FailCounterBadge";
import { hashHref } from "@/lib/hashbang";

/** The token columns of the legacy user details view. */
export const userTokenColumns: DataTableColumn<TokenDetail>[] = [
  {
    header: <Trans>serial</Trans>,
    key: "serial",
    render: (token) => (
      <Anchor
        href={hashHref(`/token/details/${encodeURIComponent(token.serial)}`)}
        size="sm"
      >
        {token.serial}
      </Anchor>
    )
  },
  {
    header: <Trans>type</Trans>,
    key: "tokentype",
    render: (token) => token.tokentype
  },
  {
    header: <Trans>Active</Trans>,
    key: "active",
    render: (token) => (
      <BooleanPill
        falseLabel={<Trans>disabled</Trans>}
        trueLabel={<Trans>active</Trans>}
        value={token.active}
      />
    )
  },
  {
    header: <Trans>window</Trans>,
    key: "count_window",
    render: (token) => token.count_window
  },
  {
    header: <Trans>description</Trans>,
    key: "description",
    render: (token) => token.description
  },
  {
    header: <Trans>failcounter</Trans>,
    key: "failcount",
    render: (token) => <FailCounterBadge token={token} />
  },
  {
    header: <Trans>maxfail</Trans>,
    key: "maxfail",
    render: (token) => token.maxfail
  },
  { header: <Trans>otplen</Trans>, key: "otplen", render: (token) => token.otplen }
];
