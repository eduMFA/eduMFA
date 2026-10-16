import { useLingui } from "@lingui/react/macro";

export interface PaginationProps {
  currentPage: number;
  maxSize?: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalCount: number;
}

/**
 * Bootstrap 3 pagination with boundary links, mirroring the legacy
 * `uib-pagination` markup. Renders nothing when everything fits on one page.
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

  const windowStart = Math.min(
    Math.max(1, currentPage - Math.floor(maxSize / 2)),
    Math.max(1, pageCount - maxSize + 1)
  );
  const windowEnd = Math.min(pageCount, windowStart + maxSize - 1);
  const pages = [];

  for (let page = windowStart; page <= windowEnd; page += 1) {
    pages.push(page);
  }

  const goToPage = (page: number) => {
    const boundedPage = Math.min(Math.max(1, page), pageCount);

    if (boundedPage !== currentPage) {
      onPageChange(boundedPage);
    }
  };

  return (
    <ul className="pagination">
      <PaginationItem
        disabled={currentPage === 1}
        label={t`First`}
        onSelect={() => {
          goToPage(1);
        }}
      />
      <PaginationItem
        disabled={currentPage === 1}
        label={t`Previous`}
        onSelect={() => {
          goToPage(currentPage - 1);
        }}
      />
      {pages.map((page) => (
        <PaginationItem
          active={page === currentPage}
          key={page}
          label={String(page)}
          onSelect={() => {
            goToPage(page);
          }}
        />
      ))}
      <PaginationItem
        disabled={currentPage === pageCount}
        label={t`Next`}
        onSelect={() => {
          goToPage(currentPage + 1);
        }}
      />
      <PaginationItem
        disabled={currentPage === pageCount}
        label={t`Last`}
        onSelect={() => {
          goToPage(pageCount);
        }}
      />
    </ul>
  );
}

interface PaginationItemProps {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onSelect: () => void;
}

function PaginationItem({ active, disabled, label, onSelect }: PaginationItemProps) {
  const classNames = [active ? "active" : "", disabled ? "disabled" : ""]
    .filter((className) => className.length > 0)
    .join(" ");

  return (
    <li className={classNames.length > 0 ? classNames : undefined}>
      <a
        aria-disabled={disabled ?? false}
        onClick={() => {
          if (!disabled) {
            onSelect();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        {label}
      </a>
    </li>
  );
}
