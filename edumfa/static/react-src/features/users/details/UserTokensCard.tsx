import { useLingui } from "@lingui/react/macro";

import { EnrollTokenButton } from "./EnrollTokenButton";
import { USER_TOKEN_PAGE_SIZE, type UserTokens } from "./useUserTokens";
import { userTokenColumns } from "./userTokenColumns";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { Card } from "@/components/layout/Card";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/tables/Pagination";
import { hashHref } from "@/lib/hashbang";

export interface UserTokensCardProps {
  canEnroll: boolean;
  realm: string;
  tokens: UserTokens;
  username: string;
}

/** The tokens assigned to the user, with the enrollment entry point. */
export function UserTokensCard({
  canEnroll,
  realm,
  tokens,
  username
}: UserTokensCardProps) {
  const { t } = useLingui();

  const enrollHref = hashHref(
    `/token/enroll/${encodeURIComponent(realm)}/${encodeURIComponent(username)}`
  );
  const tokenPageData = tokens.query.data;

  return (
    <Card
      actions={<EnrollTokenButton canEnroll={canEnroll} href={enrollHref} />}
      flush
      title={t`Tokens`}
    >
      <ErrorAlert error={tokens.query.error} />

      <Pagination
        currentPage={tokens.page}
        maxSize={5}
        onPageChange={tokens.setPage}
        pageSize={USER_TOKEN_PAGE_SIZE}
        totalCount={tokenPageData?.count ?? 0}
      />

      <DataTable
        columns={userTokenColumns}
        data={tokenPageData?.tokens ?? []}
        emptyMessage={t`No tokens assigned.`}
        getRowKey={(token) => token.serial}
        isLoading={tokens.query.isLoading}
        minWidth={760}
      />
    </Card>
  );
}
