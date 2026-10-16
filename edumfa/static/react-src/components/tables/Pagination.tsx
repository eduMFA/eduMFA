import { useLingui } from "@lingui/react/macro";
import { Box, Pagination as MantinePagination } from "@mantine/core";

export interface PaginationProps {
  currentPage: number;
  maxSize?: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalCount: number;
}

/**
 * Pager with boundary controls, mirroring the legacy `uib-pagination`
 * behaviour: it renders nothing when everything fits on one page.
 */
export function Pagination({
  currentPage,
  maxSize = 10,
  onPageChange,
  pageSize,
  totalCount
}: PaginationProps) {
  const { t } = useLingui();
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalCount <= pageSize) {
    return null;
  }

  const controlLabels = {
    first: t`First`,
    last: t`Last`,
    next: t`Next`,
    previous: t`Previous`
  };

  return (
    <Box px="md" py="sm">
      <MantinePagination
        getControlProps={(control) => ({ "aria-label": controlLabels[control] })}
        onChange={onPageChange}
        siblings={Math.max(1, Math.floor(maxSize / 2) - 1)}
        size="sm"
        total={pageCount}
        value={Math.min(Math.max(1, currentPage), pageCount)}
        withEdges
      />
    </Box>
  );
}
