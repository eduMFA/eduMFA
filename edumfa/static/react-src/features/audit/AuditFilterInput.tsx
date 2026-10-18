import { useLingui } from "@lingui/react/macro";
import { NativeSelect } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";

import {
  formatDateFilter,
  type AuditFilterName,
  type AuditFilters
} from "./auditFilters";
import { ColumnFilter } from "@/components/tables/ColumnFilter";

export interface AuditFilterInputProps {
  draftFilters: AuditFilters;
  filterName: AuditFilterName;
  /** Applies the draft now, e.g. on Enter in a text filter. */
  onApply: () => void;
  onDraftChange: (name: AuditFilterName, value: string) => void;
  /** Applies a complete filter set at once; selects and dates skip the debounce. */
  onReplace: (nextFilters: AuditFilters) => void;
}

/** The header filter of one column: a select for `success`, a date picker for dates, text otherwise. */
export function AuditFilterInput({
  draftFilters,
  filterName,
  onApply,
  onDraftChange,
  onReplace
}: AuditFilterInputProps) {
  const { t } = useLingui();

  if (filterName === "success") {
    return (
      <NativeSelect
        aria-label={filterName}
        data={[
          { label: t`any`, value: "" },
          { label: t`yes`, value: "1" },
          { label: t`no`, value: "0" }
        ]}
        onChange={(event) => {
          onReplace({ ...draftFilters, success: event.currentTarget.value });
        }}
        size="xs"
        value={draftFilters.success ?? ""}
      />
    );
  }

  if (filterName === "date" || filterName === "startdate") {
    return (
      <DatePickerInput
        aria-label={filterName}
        clearable
        leftSection={<IconCalendar size={14} />}
        leftSectionPointerEvents="none"
        onChange={(value) => {
          onReplace({ ...draftFilters, [filterName]: formatDateFilter(value) });
        }}
        placeholder={t`Pick a date`}
        size="xs"
        value={draftFilters[filterName] || null}
        valueFormat="YYYY-MM-DD"
      />
    );
  }

  return (
    <ColumnFilter
      label={filterName}
      onChange={(value) => {
        onDraftChange(filterName, value);
      }}
      onSubmit={() => {
        onApply();
      }}
      value={draftFilters[filterName] ?? ""}
    />
  );
}
